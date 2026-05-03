import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({ component: UsersPage });

type Member = { id: string; full_name: string | null; email: string; is_active: boolean; roles: string[] };
type Invite = { id: string; email: string; role: string; token: string; status: string; expires_at: string };

function UsersPage() {
  const { company, roles } = useAuth();
  const isAdmin = roles.includes("company_admin") || roles.includes("super_admin");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "finance" | "company_admin">("agent");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const limit = company?.plan?.user_limit ?? 0;
  const used = members.length + invites.filter(i => i.status === "pending").length;

  const load = async () => {
    if (!company) return;
    setLoading(true);
    const [{ data: profs }, { data: roleRows }, { data: invs }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,is_active").eq("company_id", company.id),
      supabase.from("user_roles").select("user_id,role").eq("company_id", company.id),
      supabase.from("company_invites").select("id,email,role,token,status,expires_at").eq("company_id", company.id).order("created_at", { ascending: false }),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (roleRows ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    setMembers((profs ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] })));
    setInvites(invs ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [company?.id]);

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (used >= limit) { toast.error(`Plan limit reached (${limit} users). Upgrade to add more.`); return; }
    setSubmitting(true);
    const { error } = await supabase.from("company_invites").insert({ company_id: company.id, email, role });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite created for ${email}`);
    setEmail(""); setOpen(false); load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("company_invites").update({ status: "revoked" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Invite revoked"); load(); }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/signup?invite=${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <PageHeader
        title="Users & Invites"
        subtitle={`${used} of ${limit} seats used on ${company?.plan?.name ?? "Free"} plan`}
        actions={isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="size-4" /> Invite user</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite a teammate</DialogTitle></DialogHeader>
              <form onSubmit={invite} className="space-y-4">
                <div>
                  <Label htmlFor="iemail">Email address</Label>
                  <Input id="iemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent — operations</SelectItem>
                      <SelectItem value="finance">Finance — billing & payments</SelectItem>
                      <SelectItem value="company_admin">Admin — full access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create invite"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      />

      <div className="px-8 py-8 space-y-8">
        <section>
          <h2 className="font-display font-semibold mb-3">Members</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr> :
                  members.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{m.full_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{m.roles[0]?.replace("_"," ") || "member"}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${m.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{m.is_active ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {invites.length > 0 && (
          <section>
            <h2 className="font-display font-semibold mb-3">Pending invites</h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="px-4 py-3">{i.email}</td>
                      <td className="px-4 py-3 capitalize">{i.role.replace("_"," ")}</td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{i.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {i.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => copyLink(i.token)} className="gap-1.5">
                              {copied === i.token ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy link
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => revoke(i.id)}><Trash2 className="size-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
