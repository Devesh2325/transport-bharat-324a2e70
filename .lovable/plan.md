# Phase 3 — TransFlow Enhancements

This is a large scope. I'll break it into 8 deliverables and ship them in order. Confirm before I begin (or tell me to reorder / drop items).

## 1. Expenses Module (new)
**DB migration** — new tables:
- `employees` (company_id, name, phone, email, designation, monthly_salary, joined_at, active)
- `expense_categories` enum: `employee_salary | fuel | vehicle_maintenance | toll | office | misc`
- `expenses` (company_id, category, amount, expense_date, employee_id?, vehicle_id?, description, paid_by, reference, attachment_url)
- RLS scoped to `current_company_id()`, GRANTs to `authenticated` + `service_role`.

**UI** — new route `src/routes/_authenticated/expenses.tsx` with tabs:
- Daily Expenses (add/list/filter by date+category)
- Employees (CRUD + monthly salary)
- Salary Payments (pay employee → creates `employee_salary` expense)
- Sidebar link in `AppShell`.

**Report** — extend `reports.tsx` with Expense Report (date/employee/category filters, XLSX+PDF export).

## 2. Bilty & Invoice PDF Fix
- Audit current `orders.$orderId.bilty.tsx` + `invoices.$invoiceId.tsx` print templates.
- Fix missing fields (consignor/consignee full address, GSTIN, item table, freight breakup, amount in words, GST split).
- `downloadElementAsPDF` already exists — switch to A4-fit rendering with proper margins and forced light bg (works in dark mode too).
- Add Preview button → opens modal with same template before Print/Download.

## 3. GST Selection on Order Bill
- Order Bill form: GST dropdown (None / 5% / 12% / 18% / 28%) with auto IGST vs CGST+SGST based on company state vs party state.
- Remove the "Client GST selection" field as requested.

## 4. Transporter Multi-Payment
- Reuse `payments` table (`direction='payable'`). Add `payment_type` column: `advance | final | partial`.
- Order detail: "Transporter Payments" section — list payments + Add Payment button.
- Status badge derived: Pending (0), Partial (>0 <total), Paid (≥total).
- Show full history inline.

## 5. Bilty Branding Settings
- Add to `settings.tsx`: Company Logo, Stamp/Seal — upload (Lovable Cloud storage bucket `branding`, public) OR paste URL.
- New columns on `companies`: `logo_url`, `stamp_url` (migration).
- Bilty + Invoice templates render logo top-left, stamp above signature.

## 6. Bilty Preview Fix
- Rewrite print template with fixed A4 width (`210mm`), table-based layout, inline styles so html2canvas captures identically.
- Preview modal renders the same component → WYSIWYG with download.

## 7. Full Dark Mode
- Audit all routes for hardcoded `bg-white`, `text-black`, `text-gray-*` → replace with semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`).
- Add theme toggle in AppShell header (persist to localStorage, toggle `.dark` on `<html>`).
- Print templates keep forced light (`@media print` + inline white bg).

## 8. Landing Page Restore
Rewrite `src/routes/index.tsx` keeping hero, adding:
- Features (existing 6-card grid — keep)
- Benefits (new 3-col with metrics)
- How It Works (4-step timeline)
- Testimonials (3 quote cards)
- FAQ (accordion, 6 Qs)
- Contact (form posting to a `contact_messages` table + email/phone/address)
- Footer with links
- Responsive (mobile-first, tested at 375/768/1280).

---

## Order of execution
1. DB migrations (Expenses tables, companies branding cols, payment_type col, contact_messages) — single approval
2. Storage bucket `branding` (public)
3. Code: Expenses → Settings/branding → Bilty/Invoice template rewrite + preview → GST on order → Transporter payments → Dark mode pass → Landing page

## Estimated scope
~15-20 files touched/created, 1 migration, 1 storage bucket. Will ship in one pass and report back per section.

**Proceed?** Or tell me to start with a subset (e.g. just #2 + #6 + #8 first, then the rest).