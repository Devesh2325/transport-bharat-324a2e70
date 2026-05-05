
-- Products master
create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  hsn_code text,
  unit text default 'MT',
  default_rate numeric default 0,
  gst_rate numeric default 5,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_company on public.products(company_id);
alter table public.products enable row level security;
create policy "products company read" on public.products for select to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()));
create policy "products company write" on public.products for all to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()))
  with check (company_id = current_company_id() or is_super_admin(auth.uid()));
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Multi-GST registrations per party
create table public.party_gst_registrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  party_id uuid not null references public.parties(id) on delete cascade,
  gstin text not null,
  legal_name text,
  state text not null,
  address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_pgr_party on public.party_gst_registrations(party_id);
create index idx_pgr_company on public.party_gst_registrations(company_id);
create unique index idx_pgr_party_state on public.party_gst_registrations(party_id, state);
alter table public.party_gst_registrations enable row level security;
create policy "pgr company read" on public.party_gst_registrations for select to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()));
create policy "pgr company write" on public.party_gst_registrations for all to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()))
  with check (company_id = current_company_id() or is_super_admin(auth.uid()));

-- Orders extension
alter table public.orders
  add column if not exists product_id uuid,
  add column if not exists consignor_state text,
  add column if not exists consignee_state text,
  add column if not exists party_gst_id uuid,
  add column if not exists gst_rate numeric default 5,
  add column if not exists cgst_amount numeric default 0,
  add column if not exists sgst_amount numeric default 0,
  add column if not exists igst_amount numeric default 0,
  add column if not exists total_amount numeric default 0;

-- Inquiries extension
alter table public.inquiries
  add column if not exists product_id uuid;

-- Smart GST picker: prefer state match, else default, else any
create or replace function public.pick_party_gst(_party_id uuid, _state text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.party_gst_registrations
  where party_id = _party_id
  order by (state = _state) desc, is_default desc, created_at asc
  limit 1;
$$;
