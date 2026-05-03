
-- Enums
create type public.app_role as enum ('super_admin','company_admin','agent','finance','transporter');
create type public.subscription_status as enum ('trial','active','expired','suspended');
create type public.invite_status as enum ('pending','accepted','revoked','expired');

-- Plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_inr numeric(10,2) not null default 0,
  user_limit integer not null default 5,
  storage_mb integer not null default 500,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (code,name,price_inr,user_limit,storage_mb,features) values
('free','Free',0,2,200,'{"reports":false,"white_label":false}'),
('pro','Pro',1499,10,5000,'{"reports":true,"white_label":true}'),
('enterprise','Enterprise',4999,100,50000,'{"reports":true,"white_label":true,"custom_domain":true}');

-- Companies (tenants)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  plan_expires_at timestamptz,
  logo_url text,
  brand_primary text default '#6366f1',
  brand_accent text default '#8b5cf6',
  gst_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.companies(plan_id);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index on public.profiles(company_id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, company_id, role)
);

create index on public.user_roles(user_id);
create index on public.user_roles(company_id);

-- Invites
create table public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'agent',
  token text not null unique default encode(gen_random_bytes(24),'hex'),
  status public.invite_status not null default 'pending',
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index on public.company_invites(company_id);
create index on public.company_invites(email);

-- Security definer helpers
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'super_admin')
$$;

create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.user_in_company(_user_id uuid, _company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and company_id = _company_id)
$$;

-- Signup trigger: create company + admin profile + role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_slug text;
  v_free_plan uuid;
  v_invite public.company_invites%rowtype;
  v_invite_token text;
begin
  v_invite_token := nullif(new.raw_user_meta_data->>'invite_token','');

  if v_invite_token is not null then
    select * into v_invite from public.company_invites
      where token = v_invite_token and status = 'pending' and expires_at > now()
      limit 1;
    if found then
      insert into public.profiles (id, company_id, email, full_name)
        values (new.id, v_invite.company_id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
      insert into public.user_roles (user_id, company_id, role)
        values (new.id, v_invite.company_id, v_invite.role);
      update public.company_invites set status = 'accepted' where id = v_invite.id;
      return new;
    end if;
  end if;

  -- Default: create new company workspace
  v_company_name := coalesce(nullif(new.raw_user_meta_data->>'company_name',''), split_part(new.email,'@',1) || '''s Workspace');
  v_slug := lower(regexp_replace(v_company_name,'[^a-zA-Z0-9]+','-','g')) || '-' || substr(replace(new.id::text,'-',''),1,6);
  select id into v_free_plan from public.plans where code='free' limit 1;

  insert into public.companies (name, slug, plan_id) values (v_company_name, v_slug, v_free_plan)
    returning id into v_company_id;

  insert into public.profiles (id, company_id, email, full_name)
    values (new.id, v_company_id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  insert into public.user_roles (user_id, company_id, role)
    values (new.id, v_company_id, 'company_admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for companies
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_companies_updated before update on public.companies
  for each row execute function public.touch_updated_at();

-- Enable RLS
alter table public.plans enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.company_invites enable row level security;

-- Plans: readable to all authenticated, writable only by super admin
create policy "plans readable" on public.plans for select to authenticated using (true);
create policy "plans super admin write" on public.plans for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

-- Companies
create policy "companies own select" on public.companies for select to authenticated
  using (id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "companies admin update" on public.companies for update to authenticated
  using (
    (id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  )
  with check (
    (id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  );
create policy "companies super insert" on public.companies for insert to authenticated
  with check (public.is_super_admin(auth.uid()));
create policy "companies super delete" on public.companies for delete to authenticated
  using (public.is_super_admin(auth.uid()));

-- Profiles
create policy "profiles self select" on public.profiles for select to authenticated
  using (id = auth.uid() or company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin')) or public.is_super_admin(auth.uid()))
  with check (id = auth.uid() or (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin')) or public.is_super_admin(auth.uid()));

-- User roles
create policy "roles select in company" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "roles admin manage" on public.user_roles for all to authenticated
  using (
    (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  )
  with check (
    (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  );

-- Invites
create policy "invites company read" on public.company_invites for select to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
create policy "invites admin manage" on public.company_invites for all to authenticated
  using (
    (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  )
  with check (
    (company_id = public.current_company_id() and public.has_role(auth.uid(),'company_admin'))
    or public.is_super_admin(auth.uid())
  );
