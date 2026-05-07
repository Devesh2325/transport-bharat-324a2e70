import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartyCombobox } from "@/components/PartyCombobox";
import { VehicleCombobox } from "@/components/VehicleCombobox";
import { ProductCombobox, type ProductLite } from "@/components/ProductCombobox";
import { StateSelect } from "@/components/StateSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtINR, fmtDate, nextDocNo } from "@/lib/queries";
import { calcGst } from "@/lib/states";
import { Plus, ArrowRight, FileText, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface OrderSearch { fromInquiry?: string }

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
  validateSearch: (s: Record<string, unknown>): OrderSearch => ({ fromInquiry: typeof s.fromInquiry === "string" ? s.fromInquiry : undefined }),
});

interface Row {
  id: string; order_no: string; from_city: string | null; to_city: string | null;
  freight_amount: number; advance_amount: number; total_amount: number | null; status: string; bilty_no: string | null;
  pickup_at: string | null; delivered_at: string | null; created_at: string;
  cgst_amount: number | null; sgst_amount: number | null; igst_amount: number | null;
  parties: { name: string } | null; vehicles: { number: string } | null;
}

const empty = {
  party_id: null as string | null, vehicle_id: null as string | null, product_id: null as string | null,
  party_gst_id: null as string | null,
  transporter_party_id: null as string | null, transporter_amount: "",
  from_city: "", to_city: "", consignor_state: "", consignee_state: "",
  material: "", weight_tons: "", freight_amount: "", advance_amount: "",
  driver_name: "", driver_phone: "", gst_rate: "5",
};

function OrdersPage() {
  const { company, user, roles } = useAuth();
  const isAdmin = roles.includes("company_admin") || roles.includes("super_admin");
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/orders" });
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [partyGsts, setPartyGsts] = useState<{ id: string; gstin: string; state: string; is_default: boolean }[]>([]);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("orders")
      .select("id,order_no,from_city,to_city,freight_amount,advance_amount,total_amount,status,bilty_no,pickup_at,delivered_at,created_at,cgst_amount,sgst_amount,igst_amount,parties(name),vehicles(number)")
      .eq("company_id", company.id).order("created_at", { ascending: false });
    setRows((data ?? []) as never as Row[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  // Auto-prefill from inquiry
  useEffect(() => {
    (async () => {
      if (!search.fromInquiry || !company) return;
      const { data: inq } = await supabase.from("inquiries").select("party_id,from_city,to_city,material,weight_tons,expected_rate,product_id").eq("id", search.fromInquiry).maybeSingle();
      if (!inq) return;
      let gstRate = "5";
      if (inq.product_id) {
        const { data: pr } = await supabase.from("products").select("gst_rate").eq("id", inq.product_id).maybeSingle();
        if (pr?.gst_rate != null) gstRate = String(pr.gst_rate);
      }
      setForm(f => ({
        ...f,
        party_id: inq.party_id, product_id: inq.product_id ?? null,
        from_city: inq.from_city ?? "", to_city: inq.to_city ?? "",
        material: inq.material ?? "", weight_tons: inq.weight_tons ? String(inq.weight_tons) : "",
        freight_amount: inq.expected_rate ? String(inq.expected_rate) : "",
        gst_rate: gstRate,
      }));
      setOpen(true);
      navigate({ to: "/orders", search: {}, replace: true });
    })();
  }, [search.fromInquiry, company?.id]);

  // Load GSTs of selected party + auto-pick by consignee state
  useEffect(() => {
    (async () => {
      if (!form.party_id) { setPartyGsts([]); return; }
      const { data } = await supabase.from("party_gst_registrations").select("id,gstin,state,is_default").eq("party_id", form.party_id);
      const gsts = data ?? [];
      setPartyGsts(gsts);
      if (form.consignee_state) {
        const { data: picked } = await supabase.rpc("pick_party_gst", { _party_id: form.party_id, _state: form.consignee_state });
        if (picked) setForm(f => ({ ...f, party_gst_id: picked as string }));
      } else {
        const def = gsts.find(g => g.is_default) ?? gsts[0];
        if (def) setForm(f => ({ ...f, party_gst_id: def.id }));
      }
    })();
  }, [form.party_id, form.consignee_state]);

  const onProductPick = (p: ProductLite) => {
    setForm(f => ({
      ...f,
      gst_rate: p.gst_rate != null ? String(p.gst_rate) : f.gst_rate,
      freight_amount: f.freight_amount || (p.default_rate ? String(p.default_rate) : ""),
      material: p.name,
    }));
  };

  const submit = async () => {
    if (!company || !user) return;
    const order_no = await nextDocNo(company.id, "ORD");
    const base = Number(form.freight_amount || 0);
    const split = calcGst(base, Number(form.gst_rate || 0), form.consignor_state, form.consignee_state);
    const { error } = await supabase.from("orders").insert({
      company_id: company.id, order_no,
      party_id: form.party_id, vehicle_id: form.vehicle_id, product_id: form.product_id,
      transporter_party_id: form.transporter_party_id,
      transporter_amount: Number(form.transporter_amount || 0),
      party_gst_id: form.party_gst_id, gst_rate: Number(form.gst_rate || 0),
      consignor_state: form.consignor_state || null, consignee_state: form.consignee_state || null,
      cgst_amount: split.cgst, sgst_amount: split.sgst, igst_amount: split.igst, total_amount: split.total,
      from_city: form.from_city, to_city: form.to_city, material: form.material,
      weight_tons: form.weight_tons ? Number(form.weight_tons) : null,
      freight_amount: base, advance_amount: Number(form.advance_amount || 0),
      driver_name: form.driver_name, driver_phone: form.driver_phone, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`Order ${order_no} created`);
    setOpen(false); setForm(empty); load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch = {
      status: status as never,
      ...(status === "loaded" ? { pickup_at: new Date().toISOString() } : {}),
      ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    };
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const generateBilty = async (id: string) => {
    if (!company) return;
    const { data: row } = await supabase.from("orders").select("bilty_no").eq("id", id).single();
    if (!row?.bilty_no) {
      const bilty_no = await nextDocNo(company.id, "BLT");
      await supabase.from("orders").update({ bilty_no }).eq("id", id);
    }
    window.open(`/orders/${id}/bilty`, "_blank");
    load();
  };

  const generateInvoice = async (id: string) => {
    if (!company) return;
    const { data: o } = await supabase.from("orders").select("*").eq("id", id).single();
    if (!o) return;
    const { data: existing } = await supabase.from("invoices").select("id").eq("order_id", id).maybeSingle();
    if (existing) { window.open(`/invoices/${existing.id}`, "_blank"); return; }
    const seq = await nextDocNo(company.id, "ORD" as never);
    const invoice_no = seq.replace("ORD-", "INV-");
    const sub = Number(o.freight_amount);
    const { data: inv, error } = await supabase.from("invoices").insert({
      company_id: company.id, invoice_no, order_id: id, party_id: o.party_id, party_gst_id: o.party_gst_id,
      consignor_state: o.consignor_state, consignee_state: o.consignee_state,
      subtotal: sub, cgst_amount: o.cgst_amount ?? 0, sgst_amount: o.sgst_amount ?? 0, igst_amount: o.igst_amount ?? 0,
      total_amount: o.total_amount || sub, created_by: user?.id ?? null,
    }).select("id").single();
    if (error || !inv) return toast.error(error?.message ?? "Failed");
    await supabase.from("invoice_items").insert({
      company_id: company.id, invoice_id: inv.id,
      description: `Freight ${o.from_city ?? ""} to ${o.to_city ?? ""} · ${o.material ?? ""}`,
      qty: 1, unit: "Trip", rate: sub, amount: sub, gst_rate: o.gst_rate ?? 5,
    });
    toast.success(`Invoice ${invoice_no} generated`);
    window.open(`/invoices/${inv.id}`, "_blank");
  };

  const filtered = rows.filter(r => filter === "all" || r.status === filter);
  const base = Number(form.freight_amount || 0);
  const preview = calcGst(base, Number(form.gst_rate || 0), form.consignor_state, form.consignee_state);

  return (
    <div>
      <PageHeader title="Orders" subtitle="Active dispatches, vehicles, GST and bilty (LR)."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> New Order</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader><SheetTitle>New Order</SheetTitle></SheetHeader>
              <div className="grid gap-3 mt-4">
                <div><Label>Party</Label><PartyCombobox value={form.party_id} onChange={v => setForm({ ...form, party_id: v })} type="client" /></div>
                {partyGsts.length > 0 && (
                  <div><Label>Bill to GSTIN</Label>
                    <Select value={form.party_gst_id ?? undefined} onValueChange={v => setForm({ ...form, party_gst_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select GSTIN" /></SelectTrigger>
                      <SelectContent>{partyGsts.map(g => <SelectItem key={g.id} value={g.id}><span className="font-mono text-xs">{g.gstin}</span> · {g.state}{g.is_default ? " · default" : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Vehicle</Label><VehicleCombobox value={form.vehicle_id} onChange={v => setForm({ ...form, vehicle_id: v })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Transporter</Label><PartyCombobox value={form.transporter_party_id} onChange={v => setForm({ ...form, transporter_party_id: v })} type="transporter" /></div>
                  <div><Label>Transporter cost (₹)</Label><Input type="number" value={form.transporter_amount} onChange={e => setForm({ ...form, transporter_amount: e.target.value })} placeholder="Amount payable to transporter" /></div>
                </div>
                <div><Label>Product</Label><ProductCombobox value={form.product_id} onChange={v => setForm({ ...form, product_id: v })} onPick={onProductPick} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From city</Label><Input value={form.from_city} onChange={e => setForm({ ...form, from_city: e.target.value })} /></div>
                  <div><Label>To city</Label><Input value={form.to_city} onChange={e => setForm({ ...form, to_city: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Consignor state</Label><StateSelect value={form.consignor_state} onChange={v => setForm({ ...form, consignor_state: v })} /></div>
                  <div><Label>Consignee state</Label><StateSelect value={form.consignee_state} onChange={v => setForm({ ...form, consignee_state: v })} /></div>
                </div>
                <div><Label>Material</Label><Input value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Weight (t)</Label><Input type="number" value={form.weight_tons} onChange={e => setForm({ ...form, weight_tons: e.target.value })} /></div>
                  <div><Label>Freight (₹)</Label><Input type="number" value={form.freight_amount} onChange={e => setForm({ ...form, freight_amount: e.target.value })} /></div>
                  <div><Label>GST %</Label><Input type="number" value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })} /></div>
                </div>
                <div><Label>Advance (₹)</Label><Input type="number" value={form.advance_amount} onChange={e => setForm({ ...form, advance_amount: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Driver</Label><Input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} /></div>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Tax preview · {preview.interstate ? "IGST (interstate)" : "CGST + SGST (intrastate)"}</div>
                  <div className="flex justify-between"><span>Freight</span><span>{fmtINR(base)}</span></div>
                  {preview.interstate
                    ? <div className="flex justify-between"><span>IGST</span><span>{fmtINR(preview.igst)}</span></div>
                    : <><div className="flex justify-between"><span>CGST</span><span>{fmtINR(preview.cgst)}</span></div><div className="flex justify-between"><span>SGST</span><span>{fmtINR(preview.sgst)}</span></div></>}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{fmtINR(preview.total)}</span></div>
                  {isAdmin && Number(form.transporter_amount || 0) > 0 && (
                    <div className="flex justify-between border-t pt-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <span>Margin (Freight − Transporter)</span>
                      <span>{fmtINR(base - Number(form.transporter_amount || 0))}</span>
                    </div>
                  )}
                </div>
              </div>
              <SheetFooter className="mt-4"><Button onClick={submit}>Create</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        } />

      <div className="p-6 md:p-8 space-y-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["created","loaded","in_transit","delivered","cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Party</TableHead><TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead><TableHead className="text-right">Freight</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
              <TableHead>Bilty</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">No orders. Create your first order.</TableCell></TableRow>}
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}>
                  <TableCell className="font-mono text-xs">{r.order_no}</TableCell>
                  <TableCell>{r.parties?.name ?? "—"}</TableCell>
                  <TableCell>{r.from_city} <ArrowRight className="inline size-3 mx-1 text-muted-foreground" /> {r.to_city}</TableCell>
                  <TableCell className="text-xs">{r.vehicles?.number ?? "—"}</TableCell>
                  <TableCell className="text-right">{fmtINR(r.freight_amount)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtINR(r.total_amount || r.freight_amount)}</TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell className="font-mono text-xs">{r.bilty_no ?? "—"}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()} className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => generateBilty(r.id)}><FileText className="size-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <OrderDetail id={detailId} isAdmin={isAdmin} onClose={() => { setDetailId(null); load(); }} onStatus={setStatus} onBilty={generateBilty} onInvoice={generateInvoice} />
    </div>
  );
}

interface DetailRow extends Row { transporter_amount?: number | null; profit_amount?: number | null; transporter_party_id?: string | null }

function OrderDetail({ id, isAdmin, onClose, onStatus, onBilty, onInvoice }: { id: string | null; isAdmin: boolean; onClose: () => void; onStatus: (id: string, s: string) => void; onBilty: (id: string) => void; onInvoice: (id: string) => void }) {
  const [data, setData] = useState<DetailRow | null>(null);
  const [transporterName, setTransporterName] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: d } = await supabase.from("orders").select("id,order_no,from_city,to_city,freight_amount,advance_amount,total_amount,status,bilty_no,pickup_at,delivered_at,created_at,cgst_amount,sgst_amount,igst_amount,transporter_amount,profit_amount,transporter_party_id,parties(name),vehicles(number)").eq("id", id).maybeSingle();
      setData(d as never as DetailRow);
      if (d?.transporter_party_id) {
        const { data: tp } = await supabase.from("parties").select("name").eq("id", d.transporter_party_id).maybeSingle();
        setTransporterName(tp?.name ?? null);
      } else setTransporterName(null);
    })();
  }, [id]);
  const STEPS = ["created","loaded","in_transit","delivered"];
  return (
    <Sheet open={!!id} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Order {data?.order_no}</SheetTitle></SheetHeader>
        {data && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">Party</div><div>{data.parties?.name}</div></div>
              <div><div className="text-muted-foreground text-xs">Vehicle</div><div>{data.vehicles?.number ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Route</div><div>{data.from_city} → {data.to_city}</div></div>
              <div><div className="text-muted-foreground text-xs">Freight</div><div>{fmtINR(data.freight_amount)}</div></div>
              <div><div className="text-muted-foreground text-xs">Transporter</div><div>{data.transporter_party?.name ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Transporter cost</div><div>{fmtINR(data.transporter_amount)}</div></div>
              <div><div className="text-muted-foreground text-xs">CGST/SGST</div><div>{fmtINR((data.cgst_amount || 0) + (data.sgst_amount || 0))}</div></div>
              <div><div className="text-muted-foreground text-xs">IGST</div><div>{fmtINR(data.igst_amount)}</div></div>
              <div><div className="text-muted-foreground text-xs">Total</div><div className="font-semibold">{fmtINR(data.total_amount || data.freight_amount)}</div></div>
              <div><div className="text-muted-foreground text-xs">Balance</div><div>{fmtINR((data.total_amount || data.freight_amount) - Number(data.advance_amount))}</div></div>
              {isAdmin && (
                <div className="col-span-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                  <div className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Margin (Admin only)</div>
                  <div className="font-display font-bold text-xl text-emerald-700 dark:text-emerald-400">{fmtINR(data.profit_amount)}</div>
                </div>
              )}
              <div><div className="text-muted-foreground text-xs">Pickup</div><div>{fmtDate(data.pickup_at)}</div></div>
              <div><div className="text-muted-foreground text-xs">Delivered</div><div>{fmtDate(data.delivered_at)}</div></div>
            </div>
            <div>
              <div className="font-medium text-sm mb-2 flex items-center gap-2"><Truck className="size-4" /> Status timeline</div>
              <div className="flex flex-wrap gap-2">
                {STEPS.map(s => (
                  <Button key={s} size="sm" variant={data.status === s ? "default" : "outline"} onClick={() => onStatus(data.id, s)} className="capitalize">
                    {data.status === s && <CheckCircle2 className="size-3 mr-1" />} {s.replace("_"," ")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => onBilty(data.id)}><FileText className="size-4 mr-1" /> {data.bilty_no ? `Bilty ${data.bilty_no}` : "Generate Bilty"}</Button>
              <Button variant="outline" onClick={() => onInvoice(data.id)}><FileText className="size-4 mr-1" /> Tax Invoice</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
