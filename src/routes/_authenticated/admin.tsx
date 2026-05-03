import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "super_admin");
    if (!rows || rows.length === 0) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { roles } = useAuth();
  const loc = useLocation();
  if (!roles.includes("super_admin")) return null;
  const tabs = [
    { to: "/admin/companies", label: "Companies", icon: Building2 },
    { to: "/admin/plans", label: "Plans", icon: ShieldCheck },
  ];
  return (
    <div>
      <div className="px-8 pt-8 border-b border-border bg-card/40">
        <div className="text-xs uppercase tracking-widest text-accent font-semibold">Super Admin</div>
        <h1 className="mt-1 text-3xl font-display font-bold">Platform control</h1>
        <nav className="mt-6 flex gap-1">
          {tabs.map((t) => {
            const active = loc.pathname === t.to;
            return (
              <Link key={t.to} to={t.to} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="size-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
