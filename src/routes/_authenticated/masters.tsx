import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StateSelect } from "@/components/StateSelect";
import { Plus, Building2, Package, Truck, Landmark, ChevronRight, Trash2, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { fmtINR } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/masters")({ component: MastersPage });

function MastersPage() {
  return (
    <div>
      <PageHeader title="Master Data" subtitle="One place to manage parties, GST registrations, products, vehicles and bank accounts." />
      <div className="p-6 md:p-8">
        <Tabs defaultValue="parties">
          <TabsList>
            <TabsTrigger value="parties"><Building2 className="size-4 mr-1" /> Parties & GST</TabsTrigger>
            <TabsTrigger value="products"><Package className="size-4 mr-1" /> Products</TabsTrigger>
            <TabsTrigger value="vehicles"><Truck className="size-4 mr-1" /> Vehicles</TabsTrigger>
            <TabsTrigger value="banks"><Landmark className="size-4 mr-1" /> Bank Accounts</TabsTrigger>
          </TabsList>
          <TabsContent value="parties" className="mt-4"><PartiesTab /></TabsContent>
          <TabsContent value="products" className="mt-4"><ProductsTab /></TabsContent>
          <TabsContent value="vehicles" className="mt-4"><VehiclesTab /></TabsContent>
          <TabsContent value="banks" className="mt-4"><BanksTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface Party { id: string; name: string; type: string; phone: string | null; email: string | null; city: string | null }
interface Gst { id: string; party_id: string; gstin: string; legal_name: string | null; state: string; address: string | null; is_default: boolean }

function PartiesTab() {
  const { company } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [gsts, setGsts] = useState<Gst[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newP, setNewP] = useState({ name: "", type: "client", phone: "", email: "", city: "", state: "", address: "", pan: "", contact_person: "", credit_limit: "", bank_name: "", bank_account_no: "", bank_ifsc: "" });

  const load = async () => {
    if (!company) return;
    const [{ data: p }, { data: g }] = await Promise.all([
      supabase.from("parties").select("id,name,type,phone,email,city").eq("company_id", company.id).order("name"),
      supabase.from("party_gst_registrations").select("id,party_id,gstin,legal_name,state,address,is_default").eq("company_id", company.id),
    ]);
    setParties((p ?? []) as Party[]); setGsts((g ?? []) as Gst[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const createParty = async () => {
    if (!company || !newP.name.trim()) return;
    const { error } = await supabase.from("parties").insert({
      company_id: company.id,
      name: newP.name, type: newP.type as never,
      phone: newP.phone, email: newP.email, city: newP.city, state: newP.state, address: newP.address,
      pan: newP.pan ? newP.pan.toUpperCase() : null, contact_person: newP.contact_person,
      credit_limit: Number(newP.credit_limit || 0),
      bank_name: newP.bank_name, bank_account_no: newP.bank_account_no, bank_ifsc: newP.bank_ifsc ? newP.bank_ifsc.toUpperCase() : null,
    });
    if (error) return toast.error(error.message);
    setNewOpen(false);
    setNewP({ name: "", type: "client", phone: "", email: "", city: "", state: "", address: "", pan: "", contact_person: "", credit_limit: "", bank_name: "", bank_account_no: "", bank_ifsc: "" });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> New Party</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Party</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name</Label><Input value={newP.name} onChange={e => setNewP({ ...newP, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={newP.type} onValueChange={v => setNewP({ ...newP, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["client","consignor","consignee","transporter"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={newP.phone} onChange={e => setNewP({ ...newP, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={newP.email} onChange={e => setNewP({ ...newP, email: e.target.value })} /></div>
              </div>
              <div><Label>City</Label><Input value={newP.city} onChange={e => setNewP({ ...newP, city: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={createParty}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead></TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead>
            <TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead>GSTs</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {parties.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No parties yet.</TableCell></TableRow>}
            {parties.map(p => {
              const partyGsts = gsts.filter(g => g.party_id === p.id);
              const expanded = open === p.id;
              return (
                <>
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpen(expanded ? null : p.id)}>
                    <TableCell><ChevronRight className={`size-4 transition-transform ${expanded ? "rotate-90" : ""}`} /></TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground text-xs">{p.type}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{p.city ?? "—"}</TableCell>
                    <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{partyGsts.length}</span></TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow key={p.id + "-exp"}>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <GstEditor party={p} gsts={partyGsts} reload={load} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GstEditor({ party, gsts, reload }: { party: Party; gsts: Gst[]; reload: () => void }) {
  const { company } = useAuth();
  const [form, setForm] = useState({ gstin: "", legal_name: "", state: "", address: "" });

  const add = async () => {
    if (!company || !form.gstin || !form.state) return toast.error("GSTIN and State are required");
    const { error } = await supabase.from("party_gst_registrations").insert({
      company_id: company.id, party_id: party.id, gstin: form.gstin.toUpperCase(),
      legal_name: form.legal_name || party.name, state: form.state, address: form.address,
      is_default: gsts.length === 0,
    });
    if (error) return toast.error(error.message);
    setForm({ gstin: "", legal_name: "", state: "", address: "" }); reload();
  };
  const remove = async (id: string) => { await supabase.from("party_gst_registrations").delete().eq("id", id); reload(); };
  const setDefault = async (id: string) => {
    await supabase.from("party_gst_registrations").update({ is_default: false }).eq("party_id", party.id);
    await supabase.from("party_gst_registrations").update({ is_default: true }).eq("id", id);
    reload();
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Registrations</div>
      <div className="space-y-2">
        {gsts.map(g => (
          <div key={g.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
            <div className="flex-1">
              <div className="font-mono">{g.gstin} <span className="text-muted-foreground">· {g.state}</span></div>
              {g.legal_name && <div className="text-xs text-muted-foreground">{g.legal_name}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => setDefault(g.id)} title={g.is_default ? "Default" : "Set default"}>
              {g.is_default ? <Star className="size-4 text-accent fill-accent" /> : <StarOff className="size-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
        {gsts.length === 0 && <div className="text-xs text-muted-foreground">No GST yet.</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input placeholder="GSTIN" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value })} />
        <StateSelect value={form.state} onChange={v => setForm({ ...form, state: v })} />
        <Input placeholder="Legal name" value={form.legal_name} onChange={e => setForm({ ...form, legal_name: e.target.value })} />
        <Input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
      </div>
      <Button size="sm" onClick={add}><Plus className="size-3 mr-1" /> Add GST</Button>
    </div>
  );
}

function ProductsTab() {
  const { company } = useAuth();
  const [items, setItems] = useState<{ id: string; name: string; hsn_code: string | null; unit: string | null; default_rate: number | null; gst_rate: number | null }[]>([]);
  const [form, setForm] = useState({ name: "", hsn_code: "", unit: "MT", default_rate: "", gst_rate: "5" });
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("products").select("id,name,hsn_code,unit,default_rate,gst_rate").eq("company_id", company.id).order("name");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [company?.id]);

  const add = async () => {
    if (!company || !form.name) return;
    const { error } = await supabase.from("products").insert({
      company_id: company.id, name: form.name, hsn_code: form.hsn_code, unit: form.unit,
      default_rate: Number(form.default_rate || 0), gst_rate: Number(form.gst_rate || 5),
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", hsn_code: "", unit: "MT", default_rate: "", gst_rate: "5" }); setOpen(false); load();
  };
  const remove = async (id: string) => { await supabase.from("products").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> New Product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>HSN</Label><Input value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} /></div>
                <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Default rate (₹)</Label><Input type="number" value={form.default_rate} onChange={e => setForm({ ...form, default_rate: e.target.value })} /></div>
                <div><Label>GST %</Label><Input type="number" value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={add}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>HSN</TableHead><TableHead>Unit</TableHead>
            <TableHead className="text-right">Rate</TableHead><TableHead>GST %</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No products yet.</TableCell></TableRow>}
            {items.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.hsn_code ?? "—"}</TableCell>
                <TableCell>{p.unit ?? "—"}</TableCell>
                <TableCell className="text-right">{fmtINR(p.default_rate)}</TableCell>
                <TableCell>{p.gst_rate ?? 0}%</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function VehiclesTab() {
  const { company } = useAuth();
  const [items, setItems] = useState<{ id: string; number: string; type: string | null; capacity_tons: number | null; owner_name: string | null; owner_phone: string | null }[]>([]);
  const [form, setForm] = useState({ number: "", type: "", capacity_tons: "", owner_name: "", owner_phone: "" });
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("vehicles").select("id,number,type,capacity_tons,owner_name,owner_phone").eq("company_id", company.id).order("number");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [company?.id]);

  const add = async () => {
    if (!company || !form.number) return;
    const { error } = await supabase.from("vehicles").insert({
      company_id: company.id, number: form.number.toUpperCase(), type: form.type, owner_name: form.owner_name, owner_phone: form.owner_phone,
      capacity_tons: form.capacity_tons ? Number(form.capacity_tons) : null,
    });
    if (error) return toast.error(error.message);
    setForm({ number: "", type: "", capacity_tons: "", owner_name: "", owner_phone: "" }); setOpen(false); load();
  };
  const remove = async (id: string) => { await supabase.from("vehicles").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> New Vehicle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Vehicle</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Number</Label><Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="MH12AB1234" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="22ft / 32ft" /></div>
                <div><Label>Capacity (t)</Label><Input type="number" value={form.capacity_tons} onChange={e => setForm({ ...form, capacity_tons: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Owner</Label><Input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} /></div>
                <div><Label>Owner phone</Label><Input value={form.owner_phone} onChange={e => setForm({ ...form, owner_phone: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={add}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Number</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead>
            <TableHead>Owner</TableHead><TableHead>Phone</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No vehicles yet.</TableCell></TableRow>}
            {items.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-mono">{v.number}</TableCell>
                <TableCell>{v.type ?? "—"}</TableCell>
                <TableCell>{v.capacity_tons ? `${v.capacity_tons}t` : "—"}</TableCell>
                <TableCell>{v.owner_name ?? "—"}</TableCell>
                <TableCell>{v.owner_phone ?? "—"}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BanksTab() {
  const { company } = useAuth();
  const [items, setItems] = useState<{ id: string; name: string; bank: string | null; account_no: string | null; ifsc: string | null; balance: number }[]>([]);
  const [form, setForm] = useState({ name: "", bank: "", account_no: "", ifsc: "" });
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("bank_accounts").select("id,name,bank,account_no,ifsc,balance").eq("company_id", company.id).order("name");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [company?.id]);

  const add = async () => {
    if (!company || !form.name) return;
    const { error } = await supabase.from("bank_accounts").insert({ ...form, company_id: company.id });
    if (error) return toast.error(error.message);
    setForm({ name: "", bank: "", account_no: "", ifsc: "" }); setOpen(false); load();
  };
  const remove = async (id: string) => { await supabase.from("bank_accounts").delete().eq("id", id); load(); };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> New Account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Bank Account</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Account name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Bank</Label><Input value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Account no</Label><Input value={form.account_no} onChange={e => setForm({ ...form, account_no: e.target.value })} /></div>
                <div><Label>IFSC</Label><Input value={form.ifsc} onChange={e => setForm({ ...form, ifsc: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={add}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Bank</TableHead><TableHead>A/C No</TableHead>
            <TableHead>IFSC</TableHead><TableHead className="text-right">Balance</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No bank accounts yet.</TableCell></TableRow>}
            {items.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.bank ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{b.account_no ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{b.ifsc ?? "—"}</TableCell>
                <TableCell className="text-right">{fmtINR(b.balance)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
