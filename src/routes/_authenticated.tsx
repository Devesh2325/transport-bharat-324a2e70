import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useAuth, planActive } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { loading, user, company, roles } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Loading workspace…</div>;
  }
  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  const isSuper = roles.includes("super_admin");
  const expired = !isSuper && company && !planActive(company);

  if (expired) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="max-w-lg text-center rounded-2xl border border-warning/40 bg-card p-10 shadow-[var(--shadow-card)]">
          <div className="mx-auto size-14 grid place-items-center rounded-full bg-warning/20 text-warning mb-4">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="text-2xl font-display font-bold">Your plan has {company?.status === "suspended" ? "been suspended" : "expired"}</h1>
          <p className="mt-2 text-muted-foreground">
            Your workspace is in read-only mode. Contact your administrator or upgrade to restore full access.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/settings"><Button variant="outline">Workspace settings</Button></Link>
            <a href="mailto:support@transflow.app"><Button>Contact support</Button></a>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = (() => {
    if (!company || isSuper) return null;
    const target = company.status === "trial" ? company.trial_ends_at : company.plan_expires_at;
    if (!target) return null;
    return Math.ceil((new Date(target).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  })();
  const showExpiryWarning = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <AppShell>
      {showExpiryWarning && (
        <div className="px-6 pt-4">
          <div className="rounded-lg border border-warning/40 bg-warning/10 text-warning px-4 py-2.5 text-sm flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Your {company?.status === "trial" ? "trial" : "plan"} expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}. Contact your admin to renew.
          </div>
        </div>
      )}
      <Outlet />
    </AppShell>
  );
}
