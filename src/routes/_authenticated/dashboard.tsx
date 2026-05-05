import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, planActive } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Inbox, ClipboardList, Wallet, TrendingUp, Plus, ArrowRight, Database, Users, Palette, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { fmtINR, fmtDate } from "@/lib/queries";
import { differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function StatCard({ icon: Icon, label, value, accent, to }: { icon: typeof Inbox; label: string; value: string; accent?: string; to?: string }) {
  const body = (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-3xl font-display font-bold">{value}</div>
        </div>
        <div className={`size-10 grid place-items-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

interface Recent { id: string; kind: "inquiry" | "order" | "payment"; label: string; sub: string; date: string; to: string }

function Dashboard() {
  const { profile, company } = useAuth();
  const trialDaysLeft = company?.status === "trial" ? Math.max(0, differenceInDays(new Date(company.trial_ends_at), new Date())) : null;
  const [stats, setStats] = useState({ openInq: 0, activeOrders: 0, outstanding: 0, mtdRevenue: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);
  const [setup, setSetup] = useState({ parties: false, products: false, vehicles: false, branded: false });

  useEffect(() => {
    if (!company) return;
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const [inq, ord, allOrd, payRcv, partyCt, prodCt, vehCt] = await Promise.all([
        supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("company_id", company.id).in("status", ["new","quoted","negotiating"]),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("company_id", company.id).in("status", ["created","loaded","in_transit"]),
        supabase.from("orders").select("freight_amount,total_amount,created_at").eq("company_id", company.id),
        supabase.from("payments").select("amount,direction").eq("company_id", company.id).eq("direction", "receivable" as never),
        supabase.from("parties").select("id", { count: "exact", head: true }).eq("company_id", company.id),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", company.id),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("company_id", company.id),
      ]);

      const billed = (allOrd.data ?? []).reduce((s, o) => s + Number(o.total_amount || o.freight_amount || 0), 0);
      const received = (payRcv.data ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const mtd = (allOrd.data ?? []).filter(o => new Date(o.created_at) >= monthStart).reduce((s, o) => s + Number(o.total_amount || o.freight_amount || 0), 0);

      setStats({ openInq: inq.count ?? 0, activeOrders: ord.count ?? 0, outstanding: Math.max(0, billed - received), mtdRevenue: mtd });

      const [rInq, rOrd, rPay] = await Promise.all([
        supabase.from("inquiries").select("id,inquiry_no,from_city,to_city,created_at,parties(name)").eq("company_id", company.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("orders").select("id,order_no,from_city,to_city,created_at,parties(name)").eq("company_id", company.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("payments").select("id,amount,direction,paid_at,parties(name)").eq("company_id", company.id).order("paid_at", { ascending: false }).limit(3),
      ]);
      const items: Recent[] = [
        ...(rInq.data ?? []).map((r): Recent => ({ id: r.id, kind: "inquiry", label: r.inquiry_no, sub: `${(r.parties as { name: string } | null)?.name ?? "—"} · ${r.from_city ?? "—"} → ${r.to_city ?? "—"}`, date: r.created_at, to: "/inquiries" })),
        ...(rOrd.data ?? []).map((r): Recent => ({ id: r.id, kind: "order", label: r.order_no, sub: `${(r.parties as { name: string } | null)?.name ?? "—"} · ${r.from_city ?? "—"} → ${r.to_city ?? "—"}`, date: r.created_at, to: "/orders" })),
        ...(rPay.data ?? []).map((r): Recent => ({ id: r.id, kind: "payment", label: `${r.direction === "receivable" ? "+" : "-"} ${fmtINR(r.amount)}`, sub: (r.parties as { name: string } | null)?.name ?? "—", date: r.paid_at, to: "/payments" })),
      ].sort((a,b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);
      setRecent(items);

      setSetup({
        parties: (partyCt.count ?? 0) > 0,
        products: (prodCt.count ?? 0) > 0,
        vehicles: (vehCt.count ?? 0) > 0,
        branded: !!company.logo_url || (company.brand_primary !== null && company.brand_primary !== "#6366f1"),
      });
    })();
  }, [company?.id]);

  const setupItems = [
    { done: setup.parties, label: "Add your first Party (client)", to: "/masters" },
    { done: setup.products, label: "Add a Product / material", to: "/masters" },
    { done: setup.vehicles, label: "Add a Vehicle to your fleet", to: "/masters" },
    { done: setup.branded, label: "Set workspace branding & logo", to: "/settings" },
  ];
  const completed = setupItems.filter(i => i.done).length;

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`} subtitle="Here's what's happening across your workspace today."
        actions={
          <div className="flex gap-2">
            <Link to="/inquiries"><Button variant="outline" size="sm"><Plus className="size-4 mr-1" />Inquiry</Button></Link>
            <Link to="/orders"><Button size="sm"><Plus className="size-4 mr-1" />Order</Button></Link>
          </div>
        } />

      <div className="px-6 md:px-8 py-6 space-y-6">
        {trialDaysLeft !== null && planActive(company) && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm flex items-center justify-between">
            <span><strong>{trialDaysLeft} days</strong> left in your free trial.</span>
            <Link to="/settings" className="text-xs underline">Upgrade</Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Inbox} label="Open inquiries" value={String(stats.openInq)} to="/inquiries" />
          <StatCard icon={ClipboardList} label="Active orders" value={String(stats.activeOrders)} accent="bg-success/15 text-success" to="/orders" />
          <StatCard icon={Wallet} label="Outstanding" value={fmtINR(stats.outstanding)} accent="bg-warning/15 text-warning" to="/payments" />
          <StatCard icon={TrendingUp} label="Revenue (MTD)" value={fmtINR(stats.mtdRevenue)} accent="bg-accent/15 text-accent-foreground" to="/reports" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Recent activity</h3>
              <Link to="/orders" className="text-xs text-muted-foreground hover:text-foreground">View all <ArrowRight className="inline size-3" /></Link>
            </div>
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No activity yet — create your first inquiry or order to get started.</p>}
            <div className="space-y-2">
              {recent.map(r => (
                <Link key={r.kind + r.id} to={r.to} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50">
                  <div className={`size-8 rounded-lg grid place-items-center ${r.kind === "inquiry" ? "bg-primary/10 text-primary" : r.kind === "order" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {r.kind === "inquiry" ? <Inbox className="size-4" /> : r.kind === "order" ? <ClipboardList className="size-4" /> : <Wallet className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.sub}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg">Setup checklist</h3>
            <div className="mt-1 text-xs text-muted-foreground">{completed} of {setupItems.length} complete</div>
            <div className="mt-4 space-y-2">
              {setupItems.map(it => (
                <Link key={it.label} to={it.to} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm">
                  {it.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                  <span className={it.done ? "line-through text-muted-foreground" : ""}>{it.label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t space-y-2">
              <Link to="/masters" className="flex items-center gap-2 text-sm hover:text-primary"><Database className="size-4" /> Manage master data</Link>
              <Link to="/users" className="flex items-center gap-2 text-sm hover:text-primary"><Users className="size-4" /> Invite team</Link>
              <Link to="/settings" className="flex items-center gap-2 text-sm hover:text-primary"><Palette className="size-4" /> Branding & settings</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
