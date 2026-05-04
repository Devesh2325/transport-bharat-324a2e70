# Make the sidebar modules fully functional

Right now Inquiries, Orders, Payments, and Reports just render a "Coming Soon" card. The auth + multi-tenant foundation is solid, so this plan replaces those stubs with real, working modules sharing the same RLS pattern (`current_company_id()`).

## 1. Database migration (multi-tenant, RLS-protected)

Add the following tables. All include `company_id uuid not null references companies(id)` and an RLS policy `using (company_id = current_company_id() or is_super_admin(auth.uid()))` for select, plus `company_admin`/`agent`/`finance` based write policies.

- **parties** — clients/consignors/consignees: `name, type (client|consignor|consignee|transporter), gst, phone, email, address, city, state`.
- **vehicles** — `number, type, capacity_tons, owner_name, owner_phone`.
- **inquiries** — `inquiry_no (auto), party_id, from_city, to_city, material, weight_tons, vehicle_type, expected_rate, status (new|quoted|negotiating|won|lost), notes, created_by`.
- **inquiry_quotes** — rate negotiation log: `inquiry_id, quoted_rate, counter_rate, note, created_by, created_at`.
- **orders** — `order_no (auto), inquiry_id (nullable), party_id, vehicle_id, driver_name, driver_phone, from_city, to_city, material, weight_tons, freight_amount, advance_amount, status (created|loaded|in_transit|delivered|cancelled), pickup_at, delivered_at, bilty_no, created_by`.
- **payments** — `order_id (nullable), party_id, direction (receivable|payable), amount, mode (cash|upi|bank|cheque), reference, paid_at, notes, created_by`.
- **bank_accounts** — `name, account_no, ifsc, bank, balance` (used for the Payments dropdown).

Helpers:
- Sequence-per-company numbering via a `next_doc_no(company_id, kind)` SQL function that maintains a `doc_counters(company_id, kind, value)` table — used for `INQ-0001`, `ORD-0001`, `BLT-0001`.
- `updated_at` trigger reused from existing `touch_updated_at()`.

## 2. Inquiries module (`/inquiries`)

- Data table: number, party, route, material, vehicle type, expected rate, status badge, created date.
- Toolbar: search by number/party/city, status filter, "+ New Inquiry" button.
- Drawer form (Sheet) for create/edit with party combobox (creates a party inline if missing).
- Row click → side panel with full details + **Negotiation log** (list of `inquiry_quotes`) + "Add quote" form + "Convert to Order" button (prefills order form, marks inquiry `won`).

## 3. Orders module (`/orders`)

- Data table: order no, party, route, vehicle, freight, advance, balance (computed), status badge, pickup/delivered dates.
- Filters: status, date range, party.
- Create/edit drawer with party + vehicle pickers (vehicles can be added on the fly).
- Row detail panel:
  - Status timeline buttons: Created → Loaded → In Transit → Delivered (updates timestamps).
  - **Generate Bilty (LR)** action: assigns `bilty_no` via `next_doc_no` and opens a print-ready HTML view at `/orders/$id/bilty` with company logo + brand colors from the `companies` row (uses existing white-label fields). Browser print → PDF.
  - Linked payments list with quick "Record payment" button.

## 4. Payments module (`/payments`)

- Two tabs: **Receivables** (from clients) and **Payables** (to transporters).
- Each tab: data table with party, linked order, amount, mode, date, reference.
- "+ Record Payment" drawer: direction toggle, party picker, optional order picker (filtered to that party), amount, mode, reference, date.
- KPI strip: Total received this month, total paid, net, outstanding (computed as `sum(orders.freight_amount) - sum(payments where direction='receivable')` per party).
- Sub-page `/payments/banks` for bank accounts CRUD.

## 5. Reports module (`/reports`)

Server-side aggregations (Supabase RPC functions) returning JSON used to render charts (recharts is already in the stack):

- **Revenue & profit per month** — bar chart from orders + payments.
- **Party-wise outstanding** — table sorted by balance desc.
- **Top routes** — orders grouped by from→to.
- **Order status mix** — donut chart.
- Date-range picker + CSV export button per report.

## 6. Sidebar / shell polish

Issue from screenshot: the active state styling was fine but every module landed on the same stub. After this change every nav link routes to a real screen. Also:
- Add a header bar with breadcrumbs + a global "+ New" menu (New Inquiry / New Order / Record Payment).
- Mobile: sidebar collapses behind a hamburger using existing Sheet primitive.

## 7. Files to add / change

```
supabase/migrations/<ts>_tms_core.sql        new — tables, RLS, doc-counter fn, RPCs
src/routes/_authenticated/inquiries.tsx      rewrite — list + drawer form
src/routes/_authenticated/inquiries.$id.tsx  new — detail + negotiation
src/routes/_authenticated/orders.tsx         rewrite — list + drawer
src/routes/_authenticated/orders.$id.tsx     new — detail + status timeline
src/routes/_authenticated/orders.$id.bilty.tsx  new — printable LR
src/routes/_authenticated/payments.tsx       rewrite — tabs + record dialog
src/routes/_authenticated/payments.banks.tsx new — bank accounts
src/routes/_authenticated/reports.tsx        rewrite — charts + filters
src/components/PartyCombobox.tsx             new — reusable
src/components/VehicleCombobox.tsx           new — reusable
src/components/StatusBadge.tsx               new
src/components/DataTable.tsx                 new — small wrapper around shadcn table
src/lib/queries.ts                           new — typed Supabase query helpers
src/components/AppShell.tsx                  edit — add top header + mobile toggle
```

## Out of scope for this pass

- Razorpay subscription billing (kept for next slice).
- Email delivery of invites (still link-based).
- Hindi i18n.
- Realtime presence (can be added later via `supabase.channel`).

Approve and I'll ship this in one go.