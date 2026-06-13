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
import { Plus, Building2, Package, Truck, Landmark, ChevronRight, Trash2, Star, StarOff, Phone, Mail, CreditCard, Banknote } from "lucide-react";
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
            <TabsTrigger value="transporters"><Truck className="size-4 mr-1" /> Transporters & Payments</TabsTrigger>
            <TabsTrigger value="products"><Package className="size-4 mr-1" /> Products</TabsTrigger>
            <TabsTrigger value="vehicles"><Truck className="size-4 mr-1" /> Vehicles</TabsTrigger>
            <TabsTrigger value="banks"><Landmark className="size-4 mr-1" /> Bank Accounts</TabsTrigger>
          </TabsList>
          <TabsContent value="parties" className="mt-4"><PartiesTab /></TabsContent>
          <TabsContent value="transporters" className="mt-4"><TransportersTab /></TabsContent>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Party</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name *</Label><Input value={newP.name} onChange={e => setNewP({ ...newP, name: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={newP.type} onValueChange={v => setNewP({ ...newP, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["client","consignor","consignee","transporter"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact person</Label><Input value={newP.contact_person} onChange={e => setNewP({ ...newP, contact_person: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={newP.phone} onChange={e => setNewP({ ...newP, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={newP.email} onChange={e => setNewP({ ...newP, email: e.target.value })} /></div>
                <div><Label>PAN</Label><Input value={newP.pan} onChange={e => setNewP({ ...newP, pan: e.target.value })} placeholder="ABCDE1234F" /></div>
              </div>
              <div><Label>Address</Label><Input value={newP.address} onChange={e => setNewP({ ...newP, address: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>City</Label><Input value={newP.city} onChange={e => setNewP({ ...newP, city: e.target.value })} /></div>
                <div><Label>State</Label><StateSelect value={newP.state} onChange={v => setNewP({ ...newP, state: v })} /></div>
                <div><Label>Credit limit (₹)</Label><Input type="number" value={newP.credit_limit} onChange={e => setNewP({ ...newP, credit_limit: e.target.value })} /></div>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Bank details</div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Bank name</Label><Input value={newP.bank_name} onChange={e => setNewP({ ...newP, bank_name: e.target.value })} /></div>
                <div><Label>Account no.</Label><Input value={newP.bank_account_no} onChange={e => setNewP({ ...newP, bank_account_no: e.target.value })} /></div>
                <div><Label>IFSC</Label><Input value={newP.bank_ifsc} onChange={e => setNewP({ ...newP, bank_ifsc: e.target.value })} /></div>
              </div>
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

interface TransporterRow {
  id: string; name: string; phone: string | null; email: string | null; city: string | null;
  contact_person: string | null; bank_name: string | null; bank_account_no: string | null; bank_ifsc: string | null;
  billed: number; advance: number; paid: number; pending: number; trips: number;
}

function TransportersTab() {
  const { company } = useAuth();
  const [rows, setRows] = useState<TransporterRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ order_no: string; from_city: string | null; to_city: string | null; transporter_amount: number; advance_amount: number; created_at: string; status: string }[]>([]);
  const [payments, setPayments] = useState<{ paid_at: string; amount: number; mode: string; reference: string | null }[]>([]);

  const load = async () => {
    if (!company) return;
    const { data: parties } = await supabase
      .from("parties")
      .select("id,name,phone,email,city,contact_person,bank_name,bank_account_no,bank_ifsc")
      .eq("company_id", company.id).eq("type", "transporter").order("name");
    const list = (parties ?? []) as Omit<TransporterRow, "billed" | "advance" | "paid" | "pending" | "trips">[];
    const ids = list.map(p => p.id);
    if (ids.length === 0) { setRows([]); return; }
    const [{ data: orders }, { data: pays }] = await Promise.all([
      supabase.from("orders").select("transporter_party_id,transporter_amount,advance_amount").eq("company_id", company.id).in("transporter_party_id", ids),
      supabase.from("payments").select("party_id,amount").eq("company_id", company.id).eq("direction", "payable").in("party_id", ids),
    ]);
    const agg = new Map<string, { billed: number; advance: number; paid: number; trips: number }>();
    (orders ?? []).forEach(o => {
      if (!o.transporter_party_id) return;
      const a = agg.get(o.transporter_party_id) ?? { billed: 0, advance: 0, paid: 0, trips: 0 };
      a.billed += Number(o.transporter_amount || 0);
      a.advance += Number(o.advance_amount || 0);
      a.trips += 1;
      agg.set(o.transporter_party_id, a);
    });
    (pays ?? []).forEach(p => {
      if (!p.party_id) return;
      const a = agg.get(p.party_id) ?? { billed: 0, advance: 0, paid: 0, trips: 0 };
      a.paid += Number(p.amount || 0);
      agg.set(p.party_id, a);
    });
    setRows(list.map(p => {
      const a = agg.get(p.id) ?? { billed: 0, advance: 0, paid: 0, trips: 0 };
      return { ...p, billed: a.billed, advance: a.advance, paid: a.paid, trips: a.trips, pending: a.billed - a.advance - a.paid };
    }));
  };
  useEffect(() => { load(); }, [company?.id]);

  const openTransporter = async (id: string) => {
    if (!company) return;
    setOpenId(id);
    const [{ data: ords }, { data: pays }] = await Promise.all([
      supabase.from("orders").select("order_no,from_city,to_city,transporter_amount,advance_amount,created_at,status").eq("company_id", company.id).eq("transporter_party_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("paid_at,amount,mode,reference").eq("company_id", company.id).eq("party_id", id).eq("direction", "payable").order("paid_at", { ascending: false }),
    ]);
    setHistory((ords ?? []) as never);
    setPayments((pays ?? []) as never);
  };

  const totals = rows.reduce((s, r) => ({ billed: s.billed + r.billed, advance: s.advance + r.advance, paid: s.paid + r.paid, pending: s.pending + r.pending }), { billed: 0, advance: 0, paid: 0, pending: 0 });
  const current = rows.find(r => r.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total billed" value={fmtINR(totals.billed)} tone="indigo" />
        <SummaryCard label="Advance paid" value={fmtINR(totals.advance)} tone="amber" />
        <SummaryCard label="Settled" value={fmtINR(totals.paid)} tone="emerald" />
        <SummaryCard label="Pending balance" value={fmtINR(totals.pending)} tone="rose" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Transporter</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Trips</TableHead>
            <TableHead className="text-right">Billed</TableHead><TableHead className="text-right">Advance</TableHead>
            <TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Pending</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No transporters yet. Add a party with type “transporter”.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openTransporter(r.id)}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.city ?? "—"}{r.contact_person ? ` · ${r.contact_person}` : ""}</div>
                </TableCell>
                <TableCell className="text-xs">
                  {r.phone && <div className="flex items-center gap-1"><Phone className="size-3" />{r.phone}</div>}
                  {r.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="size-3" />{r.email}</div>}
                </TableCell>
                <TableCell className="text-right">{r.trips}</TableCell>
                <TableCell className="text-right">{fmtINR(r.billed)}</TableCell>
                <TableCell className="text-right text-amber-700 dark:text-amber-400">{fmtINR(r.advance)}</TableCell>
                <TableCell className="text-right text-emerald-700 dark:text-emerald-400">{fmtINR(r.paid)}</TableCell>
                <TableCell className={`text-right font-semibold ${r.pending > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>{fmtINR(r.pending)}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openTransporter(r.id); }}>Details</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{current?.name ?? "Transporter"}</DialogTitle></DialogHeader>
          {current && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <MiniStat label="Billed" value={fmtINR(current.billed)} />
                <MiniStat label="Advance" value={fmtINR(current.advance)} tone="amber" />
                <MiniStat label="Paid" value={fmtINR(current.paid)} tone="emerald" />
                <MiniStat label="Pending" value={fmtINR(current.pending)} tone={current.pending > 0 ? "rose" : "muted"} />
              </div>

              <div className="rounded-lg border p-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex items-center gap-2"><Phone className="size-3 text-muted-foreground" /> {current.phone ?? "—"}</div>
                <div className="flex items-center gap-2"><Mail className="size-3 text-muted-foreground" /> {current.email ?? "—"}</div>
                <div className="flex items-center gap-2"><Banknote className="size-3 text-muted-foreground" /> {current.bank_name ?? "—"}</div>
                <div className="flex items-center gap-2"><CreditCard className="size-3 text-muted-foreground" /> {current.bank_account_no ?? "—"} {current.bank_ifsc ? `· ${current.bank_ifsc}` : ""}</div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trip history</div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Order</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead>
                      <TableHead className="text-right">Freight</TableHead><TableHead className="text-right">Advance</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {history.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-sm">No trips yet.</TableCell></TableRow>}
                      {history.map((h, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{h.order_no}</TableCell>
                          <TableCell className="text-xs">{h.from_city} → {h.to_city}</TableCell>
                          <TableCell className="capitalize text-xs">{h.status.replace("_", " ")}</TableCell>
                          <TableCell className="text-right">{fmtINR(h.transporter_amount)}</TableCell>
                          <TableCell className="text-right text-amber-700 dark:text-amber-400">{fmtINR(h.advance_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment history</div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">No payments recorded.</TableCell></TableRow>}
                      {payments.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{new Date(p.paid_at).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell className="capitalize text-xs">{p.mode}</TableCell>
                          <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                          <TableCell className="text-right text-emerald-700 dark:text-emerald-400">{fmtINR(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "indigo" | "amber" | "emerald" | "rose" }) {
  const tones = {
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-700 dark:text-indigo-400",
    amber: "from-amber-500/10 to-amber-500/0 text-amber-700 dark:text-amber-400",
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-700 dark:text-emerald-400",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-700 dark:text-rose-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${tones[tone]} p-4`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-xl font-display font-bold text-foreground">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "amber" | "emerald" | "rose" }) {
  const colors = {
    muted: "text-foreground",
    amber: "text-amber-700 dark:text-amber-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}
