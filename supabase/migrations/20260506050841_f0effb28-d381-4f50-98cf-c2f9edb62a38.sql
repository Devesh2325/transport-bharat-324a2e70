
alter table public.orders
  add column if not exists transporter_party_id uuid,
  add column if not exists transporter_amount numeric not null default 0,
  add column if not exists profit_amount numeric generated always as (freight_amount - transporter_amount) stored;

alter table public.parties
  add column if not exists pan text,
  add column if not exists contact_person text,
  add column if not exists credit_limit numeric not null default 0,
  add column if not exists bank_name text,
  add column if not exists bank_account_no text,
  add column if not exists bank_ifsc text;

alter table public.companies
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists signature_url text,
  add column if not exists stamp_url text,
  add column if not exists invoice_footer text,
  add column if not exists invoice_terms text,
  add column if not exists bank_name text,
  add column if not exists bank_account_no text,
  add column if not exists bank_ifsc text,
  add column if not exists bank_branch text,
  add column if not exists bilty_template text not null default 'standard';

alter table public.payments
  add column if not exists bank_account_id uuid,
  add column if not exists invoice_id uuid;

create table if not exists public.bilty_audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  order_id uuid not null,
  changed_by uuid,
  changes jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.bilty_audits enable row level security;
drop policy if exists "bilty_audits company read" on public.bilty_audits;
create policy "bilty_audits company read" on public.bilty_audits for select to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()));
drop policy if exists "bilty_audits company write" on public.bilty_audits;
create policy "bilty_audits company write" on public.bilty_audits for insert to authenticated
  with check (company_id = current_company_id() or is_super_admin(auth.uid()));
create index if not exists bilty_audits_order_idx on public.bilty_audits(order_id, created_at desc);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  invoice_no text not null,
  order_id uuid,
  party_id uuid,
  party_gst_id uuid,
  invoice_date date not null default current_date,
  due_date date,
  consignor_state text,
  consignee_state text,
  subtotal numeric not null default 0,
  cgst_amount numeric not null default 0,
  sgst_amount numeric not null default 0,
  igst_amount numeric not null default 0,
  total_amount numeric not null default 0,
  status text not null default 'unpaid',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
drop policy if exists "invoices company read" on public.invoices;
create policy "invoices company read" on public.invoices for select to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()));
drop policy if exists "invoices company write" on public.invoices;
create policy "invoices company write" on public.invoices for all to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()))
  with check (company_id = current_company_id() or is_super_admin(auth.uid()));
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();
create index if not exists invoices_company_idx on public.invoices(company_id, created_at desc);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  hsn_code text,
  qty numeric not null default 1,
  unit text,
  rate numeric not null default 0,
  amount numeric not null default 0,
  gst_rate numeric not null default 5,
  created_at timestamptz not null default now()
);
alter table public.invoice_items enable row level security;
drop policy if exists "invoice_items company read" on public.invoice_items;
create policy "invoice_items company read" on public.invoice_items for select to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()));
drop policy if exists "invoice_items company write" on public.invoice_items;
create policy "invoice_items company write" on public.invoice_items for all to authenticated
  using (company_id = current_company_id() or is_super_admin(auth.uid()))
  with check (company_id = current_company_id() or is_super_admin(auth.uid()));
create index if not exists invoice_items_inv_idx on public.invoice_items(invoice_id);

create or replace function public.party_ledger(_company_id uuid, _party_id uuid)
returns table(entry_date timestamptz, ref text, description text, debit numeric, credit numeric)
language sql stable security definer set search_path = public as $$
  select o.created_at as entry_date,
         o.order_no as ref,
         ('Order ' || coalesce(o.from_city,'') || ' to ' || coalesce(o.to_city,'')) as description,
         coalesce(o.total_amount, o.freight_amount) as debit,
         0::numeric as credit
  from public.orders o
  where o.company_id = _company_id and o.party_id = _party_id
  union all
  select p.paid_at, coalesce(p.reference, p.mode::text), 'Payment ' || p.mode::text,
         case when p.direction = 'payable' then p.amount else 0 end,
         case when p.direction = 'receivable' then p.amount else 0 end
  from public.payments p
  where p.company_id = _company_id and p.party_id = _party_id
  order by entry_date asc;
$$;
