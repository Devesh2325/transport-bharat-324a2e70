import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const { company, refresh, roles } = useAuth();
  const isAdmin = roles.includes("company_admin") || roles.includes("super_admin");
  const [f, setF] = useState({
    name: "", logo_url: "", brand_primary: "#1d4ed8", brand_accent: "#f59e0b", gst_number: "",
    address: "", phone: "", email: "", signature_url: "", stamp_url: "",
    invoice_footer: "", invoice_terms: "",
    bank_name: "", bank_account_no: "", bank_ifsc: "", bank_branch: "",
    bilty_template: "standard",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    supabase.from("companies").select("*").eq("id", company.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setF({
        name: data.name ?? "", logo_url: data.logo_url ?? "", brand_primary: data.brand_primary ?? "#1d4ed8",
        brand_accent: data.brand_accent ?? "#f59e0b", gst_number: data.gst_number ?? "",
        address: data.address ?? "", phone: data.phone ?? "", email: data.email ?? "",
        signature_url: data.signature_url ?? "", stamp_url: data.stamp_url ?? "",
        invoice_footer: data.invoice_footer ?? "", invoice_terms: data.invoice_terms ?? "",
        bank_name: data.bank_name ?? "", bank_account_no: data.bank_account_no ?? "",
        bank_ifsc: data.bank_ifsc ?? "", bank_branch: data.bank_branch ?? "",
        bilty_template: data.bilty_template ?? "standard",
      });
    });
  }, [company?.id]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({ ...f, logo_url: f.logo_url || null, signature_url: f.signature_url || null, stamp_url: f.stamp_url || null, gst_number: f.gst_number || null }).eq("id", company.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Workspace updated");
    refresh();
  };

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="Workspace settings" subtitle="Branding, GST, bank details, invoice template and bilty defaults." />
      <div className="px-6 md:px-8 py-8 max-w-4xl space-y-6">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display font-semibold text-lg">Plan & subscription</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Current plan</div><div className="mt-1 font-medium">{company?.plan?.name}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Status</div><div className="mt-1 font-medium capitalize">{company?.status}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Trial ends</div><div className="mt-1 font-medium">{company && format(new Date(company.trial_ends_at), "PP")}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Plan expires</div><div className="mt-1 font-medium">{company?.plan_expires_at ? format(new Date(company.plan_expires_at), "PP") : "—"}</div></div>
          </div>
        </section>

        <form onSubmit={save} className="space-y-6">
          <section className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg">Company profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Company name</Label><Input value={f.name} onChange={set("name")} disabled={!isAdmin} /></div>
              <div><Label>GSTIN</Label><Input value={f.gst_number} onChange={set("gst_number")} disabled={!isAdmin} placeholder="22AAAAA0000A1Z5" /></div>
              <div><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} disabled={!isAdmin} /></div>
              <div><Label>Email</Label><Input value={f.email} onChange={set("email")} disabled={!isAdmin} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea rows={2} value={f.address} onChange={set("address")} disabled={!isAdmin} /></div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg">Branding (used in Bilty & Invoice)</h2>
            <p className="text-xs text-muted-foreground">Upload from your device or paste an image URL. Logo and stamp appear automatically on every Bilty and Tax Invoice PDF.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <BrandingField label="Company Logo" value={f.logo_url} onChange={v => setF({ ...f, logo_url: v })} disabled={!isAdmin} companyId={company?.id ?? ""} kind="logo" />
              <BrandingField label="Stamp / Seal" value={f.stamp_url} onChange={v => setF({ ...f, stamp_url: v })} disabled={!isAdmin} companyId={company?.id ?? ""} kind="stamp" />
              <BrandingField label="Signature" value={f.signature_url} onChange={v => setF({ ...f, signature_url: v })} disabled={!isAdmin} companyId={company?.id ?? ""} kind="signature" />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div><Label>Primary colour</Label><div className="flex gap-2 items-center mt-1.5"><input type="color" value={f.brand_primary} onChange={set("brand_primary")} disabled={!isAdmin} className="h-10 w-14 rounded border" /><Input value={f.brand_primary} onChange={set("brand_primary")} disabled={!isAdmin} /></div></div>
              <div><Label>Accent colour</Label><div className="flex gap-2 items-center mt-1.5"><input type="color" value={f.brand_accent} onChange={set("brand_accent")} disabled={!isAdmin} className="h-10 w-14 rounded border" /><Input value={f.brand_accent} onChange={set("brand_accent")} disabled={!isAdmin} /></div></div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg">Bank details (printed on Invoices)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Bank name</Label><Input value={f.bank_name} onChange={set("bank_name")} disabled={!isAdmin} /></div>
              <div><Label>Branch</Label><Input value={f.bank_branch} onChange={set("bank_branch")} disabled={!isAdmin} /></div>
              <div><Label>Account number</Label><Input value={f.bank_account_no} onChange={set("bank_account_no")} disabled={!isAdmin} /></div>
              <div><Label>IFSC</Label><Input value={f.bank_ifsc} onChange={set("bank_ifsc")} disabled={!isAdmin} /></div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg">Invoice & Bilty template</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Default Bilty template</Label>
                <Select value={f.bilty_template} onValueChange={v => setF({ ...f, bilty_template: v })} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (A4)</SelectItem>
                    <SelectItem value="fullpage">Full-page detailed</SelectItem>
                    <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Invoice Terms & Conditions</Label><Textarea rows={3} value={f.invoice_terms} onChange={set("invoice_terms")} disabled={!isAdmin} placeholder="Payment due within 30 days. Interest @18% p.a. on overdue. Subject to local jurisdiction." /></div>
            <div><Label>Invoice footer note</Label><Input value={f.invoice_footer} onChange={set("invoice_footer")} disabled={!isAdmin} placeholder="Thank you for your business" /></div>
          </section>

          {isAdmin && <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>}
        </form>
      </div>
    </div>
  );
}
