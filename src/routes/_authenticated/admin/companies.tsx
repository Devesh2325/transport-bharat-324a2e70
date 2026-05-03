import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/companies")({ component: CompaniesAdmin });

type Company = {
  id: string; name: string; slug: string; status: string;
  trial_ends_at: string; plan_expires_at: string | null; created_at: string;
  plan_id: string;
  plans: { name: string; code: string } | null;
};
type Plan = { id: string; name: string; code: string };

function CompaniesAdmin() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("companies").select("id,name,slug,status,trial_ends_at,plan_expires_at,created_at,plan_id,plans(name,code)").order("created_at", { ascending: false }),
      supabase.from("plans").select("id,name,code").order("price_inr"),
    ]);
    setCompanies((c ?? []).map((x) => ({ ...x, plans: Array.isArray(x.plans) ? x.plans[0] : x.plans })) as Company[]);
    setPlans(p ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("companies").update(patch as never).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const extend = async (c: Company, days: number) => {
    const base = c.plan_expires_at ? new Date(c.plan_expires_at) : new Date();
    base.setDate(base.getDate() + days);
    await update(c.id, { plan_expires_at: base.toISOString(), status: "active" });
  };

  return (
    <div className="px-8 py-8">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Select value={c.plan_id} onValueChange={(v) => update(c.id, { plan_id: v })}>
                    <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select value={c.status} onValueChange={(v) => update(c.id, { status: v as Company["status"] })}>
                    <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.plan_expires_at ? format(new Date(c.plan_expires_at), "PP") : `Trial: ${format(new Date(c.trial_ends_at), "PP")}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1.5 justify-end">
                    <Button size="sm" variant="outline" onClick={() => extend(c, 30)}>+30d</Button>
                    <Button size="sm" variant="outline" onClick={() => extend(c, 365)}>+1y</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
