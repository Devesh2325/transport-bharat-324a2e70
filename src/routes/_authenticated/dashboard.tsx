import { createFileRoute } from "@tanstack/react-router";
import { useAuth, planActive } from "@/lib/auth";
import { Inbox, ClipboardList, Wallet, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Inbox; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
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
}

function Dashboard() {
  const { profile, company } = useAuth();
  const trialDaysLeft = company?.status === "trial" ? Math.max(0, differenceInDays(new Date(company.trial_ends_at), new Date())) : null;

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`} subtitle="Here's what's happening across your workspace today." />

      <div className="px-8 pb-12 space-y-6">
        {trialDaysLeft !== null && planActive(company) && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm flex items-center justify-between">
            <span><strong>{trialDaysLeft} days</strong> left in your free trial.</span>
            <span className="text-xs text-muted-foreground">Upgrade anytime from Settings.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Inbox} label="Open inquiries" value="0" />
          <StatCard icon={ClipboardList} label="Active orders" value="0" accent="bg-success/15 text-success" />
          <StatCard icon={Wallet} label="Outstanding" value="₹0" accent="bg-warning/15 text-warning" />
          <StatCard icon={TrendingUp} label="Revenue (MTD)" value="₹0" accent="bg-accent/15 text-accent-foreground" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg">Recent activity</h3>
            <p className="mt-2 text-sm text-muted-foreground">When your team starts logging inquiries and orders, they'll appear here.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg">Quick start</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>1. Invite your team from <strong>Users</strong></li>
              <li>2. Set your branding in <strong>Settings</strong></li>
              <li>3. Log your first inquiry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
