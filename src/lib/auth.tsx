import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "company_admin" | "agent" | "finance" | "transporter";

export interface CompanyContext {
  id: string;
  name: string;
  slug: string;
  status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at: string;
  plan_expires_at: string | null;
  logo_url: string | null;
  stamp_url: string | null;
  signature_url: string | null;
  brand_primary: string | null;
  brand_accent: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  invoice_terms: string | null;
  invoice_footer: string | null;
  bilty_template: string | null;
  plan: { code: string; name: string; user_limit: number; features: Record<string, unknown> } | null;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: { full_name: string | null; email: string; avatar_url: string | null } | null;
  roles: AppRole[];
  company: CompanyContext | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [company, setCompany] = useState<CompanyContext | null>(null);

  const loadContext = async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("full_name,email,avatar_url,company_id").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(prof ? { full_name: prof.full_name, email: prof.email, avatar_url: prof.avatar_url } : null);
    setRoles((roleRows ?? []).map((r) => r.role as AppRole));

    if (prof?.company_id) {
      const { data: comp } = await supabase
        .from("companies")
        .select("id,name,slug,status,trial_ends_at,plan_expires_at,logo_url,brand_primary,brand_accent,plans(code,name,user_limit,features)")
        .eq("id", prof.company_id)
        .maybeSingle();
      if (comp) {
        const plan = Array.isArray(comp.plans) ? comp.plans[0] : comp.plans;
        setCompany({
          id: comp.id,
          name: comp.name,
          slug: comp.slug,
          status: comp.status,
          trial_ends_at: comp.trial_ends_at,
          plan_expires_at: comp.plan_expires_at,
          logo_url: comp.logo_url,
          brand_primary: comp.brand_primary,
          brand_accent: comp.brand_accent,
          plan: plan
            ? { code: plan.code, name: plan.name, user_limit: plan.user_limit, features: (plan.features ?? {}) as Record<string, unknown> }
            : null,
        });
      } else {
        setCompany(null);
      }
    } else {
      setCompany(null);
    }
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) await loadContext(data.session.user.id);
    else { setProfile(null); setRoles([]); setCompany(null); }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s?.user) {
        // defer to avoid deadlock
        setTimeout(() => { loadContext(s.user.id); }, 0);
      } else {
        setProfile(null); setRoles([]); setCompany(null);
      }
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <Ctx.Provider value={{ loading, session, user: session?.user ?? null, profile, roles, company, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function planActive(c: CompanyContext | null): boolean {
  if (!c) return false;
  if (c.status === "suspended" || c.status === "expired") return false;
  if (c.status === "trial") return new Date(c.trial_ends_at) > new Date();
  if (c.status === "active") {
    if (!c.plan_expires_at) return true;
    return new Date(c.plan_expires_at) > new Date();
  }
  return false;
}
