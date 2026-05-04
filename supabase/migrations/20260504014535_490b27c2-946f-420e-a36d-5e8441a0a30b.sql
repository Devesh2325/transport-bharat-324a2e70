
-- Enums
create type public.party_type as enum ('client','consignor','consignee','transporter');
create type public.inquiry_status as enum ('new','quoted','negotiating','won','lost');
create type public.order_status as enum ('created','loaded','in_transit','delivered','cancelled');
create type public.payment_direction as enum ('receivable','payable');
create type public.payment_mode as enum ('cash','upi','bank','cheque');

-- Doc counters
create table public.doc_counters (
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null,
  value integer not null default 0,
  primary key (company_id, kind)
);
alter table public.doc_counters enable row level security;
create policy "doc_counters company read" on public.doc_counters for select to authenticated
  using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));

create or replace function public.next_doc_no(_company_id uuid, _kind text, _prefix text)
returns text language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into public.doc_counters (company_id, kind, value) values (_company_id, _kind, 1)
    on conflict (company_id, kind) do update set value = public.doc_counters.value + 1
    returning value into v;
  return _prefix || '-' || lpad(v::text, 5, '0');
end; $$;

-- Parties
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type public.party_type not null default 'client',
  gst text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.parties(company_id);

-- Vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text not null,
  type text,
  capacity_tons numeric(8,2),
  owner_name text,
  owner_phone text,
  created_at timestamptz not null default now()
);
create index on public.vehicles(company_id);

-- Bank accounts
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  account_no text,
  ifsc text,
  bank text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.bank_accounts(company_id);

-- Inquiries
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inquiry_no text not null,
  party_id uuid references public.parties(id) on delete set null,
  from_city text,
  to_city text,
  material text,
  weight_tons numeric(10,2),
  vehicle_type text,
  expected_rate numeric(12,2),
  status public.inquiry_status not null default 'new',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.inquiries(company_id);
create index on public.inquiries(status);

create table public.inquiry_quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  quoted_rate numeric(12,2),
  counter_rate numeric(12,2),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.inquiry_quotes(inquiry_id);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_no text not null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  party_id uuid references public.parties(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_name text,
  driver_phone text,
  from_city text,
  to_city text,
  material text,
  weight_tons numeric(10,2),
  freight_amount numeric(12,2) not null default 0,
  advance_amount numeric(12,2) not null default 0,
  status public.order_status not null default 'created',
  pickup_at timestamptz,
  delivered_at timestamptz,
  bilty_no text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(company_id);
create index on public.orders(status);
create index on public.orders(party_id);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  party_id uuid references public.parties(id) on delete set null,
  direction public.payment_direction not null,
  amount numeric(12,2) not null,
  mode public.payment_mode not null default 'bank',
  reference text,
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.payments(company_id);
create index on public.payments(order_id);
create index on public.payments(party_id);

-- updated_at triggers
create trigger trg_parties_u before update on public.parties for each row execute function public.touch_updated_at();
create trigger trg_inquiries_u before update on public.inquiries for each row execute function public.touch_updated_at();
create trigger trg_orders_u before update on public.orders for each row execute function public.touch_updated_at();

-- Enable RLS
alter table public.parties enable row level security;
alter table public.vehicles enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_quotes enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;

-- Generic per-company policies
do $$
declare t text;
begin
  for t in select unnest(array['parties','vehicles','bank_accounts','inquiries','inquiry_quotes','orders','payments']) loop
    execute format($f$
      create policy "%1$s company read" on public.%1$s for select to authenticated
        using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
      create policy "%1$s company write" on public.%1$s for all to authenticated
        using (company_id = public.current_company_id() or public.is_super_admin(auth.uid()))
        with check (company_id = public.current_company_id() or public.is_super_admin(auth.uid()));
    $f$, t);
  end loop;
end $$;

-- Aggregations RPC for reports
create or replace function public.report_revenue_by_month(_company_id uuid)
returns table(month text, revenue numeric, received numeric, paid numeric)
language sql stable security definer set search_path = public as $$
  with o as (
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, sum(freight_amount) as r
    from public.orders where company_id = _company_id group by 1
  ),
  pr as (
    select to_char(date_trunc('month', paid_at), 'YYYY-MM') as m, sum(amount) as v
    from public.payments where company_id = _company_id and direction = 'receivable' group by 1
  ),
  pp as (
    select to_char(date_trunc('month', paid_at), 'YYYY-MM') as m, sum(amount) as v
    from public.payments where company_id = _company_id and direction = 'payable' group by 1
  )
  select coalesce(o.m, pr.m, pp.m) as month,
         coalesce(o.r,0) as revenue,
         coalesce(pr.v,0) as received,
         coalesce(pp.v,0) as paid
  from o full outer join pr on pr.m = o.m full outer join pp on pp.m = coalesce(o.m, pr.m)
  order by month;
$$;

create or replace function public.report_party_outstanding(_company_id uuid)
returns table(party_id uuid, party_name text, billed numeric, received numeric, outstanding numeric)
language sql stable security definer set search_path = public as $$
  select p.id, p.name,
    coalesce((select sum(freight_amount) from public.orders o where o.party_id = p.id and o.company_id = _company_id),0) as billed,
    coalesce((select sum(amount) from public.payments pay where pay.party_id = p.id and pay.company_id = _company_id and pay.direction='receivable'),0) as received,
    coalesce((select sum(freight_amount) from public.orders o where o.party_id = p.id and o.company_id = _company_id),0)
      - coalesce((select sum(amount) from public.payments pay where pay.party_id = p.id and pay.company_id = _company_id and pay.direction='receivable'),0) as outstanding
  from public.parties p
  where p.company_id = _company_id
  order by outstanding desc;
$$;
