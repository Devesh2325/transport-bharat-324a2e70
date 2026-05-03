import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const { company, refresh, roles } = useAuth();
  const isAdmin = roles.includes("company_admin") || roles.includes("super_admin");
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [primary, setPrimary] = useState("#1d4ed8");
  const [accent, setAccent] = useState("#f59e0b");
  const [gst, setGst] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setLogo(company.logo_url ?? "");
      setPrimary(company.brand_primary ?? "#1d4ed8");
      setAccent(company.brand_accent ?? "#f59e0b");
    }
  }, [company?.id]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name, logo_url: logo || null, brand_primary: primary, brand_accent: accent, gst_number: gst || null,
    }).eq("id", company.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Workspace updated");
    refresh();
  };

  return (
    <div>
      <PageHeader title="Workspace settings" subtitle="Branding, GST, and plan details for your company." />
      <div className="px-8 py-8 max-w-3xl space-y-8">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display font-semibold text-lg">Plan & subscription</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Current plan</div><div className="mt-1 font-medium">{company?.plan?.name}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Status</div><div className="mt-1 font-medium capitalize">{company?.status}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Trial ends</div><div className="mt-1 font-medium">{company && format(new Date(company.trial_ends_at), "PP")}</div></div>
            <div><div className="text-muted-foreground text-xs uppercase tracking-wider">Plan expires</div><div className="mt-1 font-medium">{company?.plan_expires_at ? format(new Date(company.plan_expires_at), "PP") : "—"}</div></div>
          </div>
        </section>

        <form onSubmit={save} className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-display font-semibold text-lg">Branding & company info</h2>
          <div>
            <Label htmlFor="cn">Company name</Label>
            <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="logo">Logo URL</Label>
            <Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} disabled={!isAdmin} className="mt-1.5" placeholder="https://…" />
            {logo && <img src={logo} alt="Logo preview" className="mt-2 h-12 rounded border border-border bg-white p-1" />}
          </div>
          <div>
            <Label htmlFor="gst">GST number</Label>
            <Input id="gst" value={gst} onChange={(e) => setGst(e.target.value)} disabled={!isAdmin} className="mt-1.5" placeholder="22AAAAA0000A1Z5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pc">Primary color</Label>
              <div className="mt-1.5 flex gap-2 items-center">
                <input id="pc" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} disabled={!isAdmin} className="h-10 w-16 rounded border border-border bg-transparent" />
                <Input value={primary} onChange={(e) => setPrimary(e.target.value)} disabled={!isAdmin} />
              </div>
            </div>
            <div>
              <Label htmlFor="ac">Accent color</Label>
              <div className="mt-1.5 flex gap-2 items-center">
                <input id="ac" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} disabled={!isAdmin} className="h-10 w-16 rounded border border-border bg-transparent" />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} disabled={!isAdmin} />
              </div>
            </div>
          </div>
          {isAdmin && <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>}
        </form>
      </div>
    </div>
  );
}
