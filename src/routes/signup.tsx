import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Search = { invite?: string };

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): Search => ({ invite: s.invite as string | undefined }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { invite } = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: fullName,
          company_name: invite ? undefined : companyName,
          invite_token: invite,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Workspace created — welcome aboard!");
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Google sign-in failed");
    if (!r.redirected && !r.error) navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-display font-bold">{invite ? "Join your team" : "Create workspace"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{invite ? "Accept your invitation to TransFlow" : "Start your 14-day free trial. No card required."}</p>

          <Button onClick={google} variant="outline" className="w-full mt-8 gap-2">
            <svg viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your full name</Label>
              <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            {!invite && (
              <div>
                <Label htmlFor="company">Company / Agency name</Label>
                <Input id="company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" placeholder="e.g. Sharma Logistics" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Min 8 characters. We check against known leaked passwords.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating..." : invite ? "Join workspace" : "Create workspace"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground order-1 lg:order-2 [background:var(--gradient-hero),var(--sidebar)]">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold ml-auto">
          <span className="grid place-items-center size-8 rounded-md bg-[var(--gradient-brand)]"><Truck className="size-4" /></span>
          TransFlow
        </Link>
        <div>
          <h2 className="text-3xl font-display font-bold">Your own workspace.<br/>Strict data isolation.</h2>
          <p className="mt-3 opacity-80 max-w-md">Every signup creates a private workspace. You're the admin. Invite your team, configure your brand, and start dispatching in minutes.</p>
        </div>
        <p className="text-xs opacity-60">Free during 14-day trial · Cancel anytime</p>
      </div>
    </div>
  );
}
