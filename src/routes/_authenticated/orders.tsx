import { createFileRoute } from "@tanstack/react-router";
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
import { StatusBadge } from "@/components/StatusBadge";
import { fmtINR, fmtDate, nextDocNo } from "@/lib/queries";
import { Plus, ArrowRight, FileText, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders")({ component: OrdersPage });

interface Row {
  id: string; order_no: string; from_city: string | null; to_city: string | null;
  freight_amount: number; advance_amount: number; status: string; bilty_no: string | null;
  pickup_at: string | null; delivered_at: string | null; created_at: string;
  parties: { name: string } | null; vehicles: { number: string } | null;
}

const empty = { party_id: null as string | null, vehicle_id: null as string | null, from_city: "", to_city: "", material: "", weight_tons: "", freight_amount: "", advance_amount: "", driver_name: "", driver_phone: "" };

function OrdersPage() {
  const { company, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("orders")
      .select("id,order_no,from_city,to_city,freight_amount,advance_amount,status,bilty_no,pickup_at,delivered_at,created_at,parties(name),vehicles(number)")
      .eq("company_id", company.id).order("created_at", { ascending: false });
    setRows((data ?? []) as never as Row[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const submit = async () => {
    if (!company || !user) return;
    const order_no = await nextDocNo(company.id, "ORD");
    const { error } = await supabase.from("orders").insert({
      company_id: company.id, order_no,
      party_id: form.party_id, vehicle_id: form.vehicle_id,
      from_city: form.from_city, to_city: form.to_city, material: form.material,
      weight_tons: form.weight_tons ? Number(form.weight_tons) : null,
      freight_amount: Number(form.freight_amount || 0), advance_amount: Number(form.advance_amount || 0),
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

  const filtered = rows.filter(r => filter === "all" || r.status === filter);

  return (
    <div>
      <PageHeader title="Orders" subtitle="Active dispatches, vehicles and bilty (LR)."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> New Order</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New Order</SheetTitle></SheetHeader>
              <div className="grid gap-3 mt-4">
                <div><Label>Party</Label><PartyCombobox value={form.party_id} onChange={v => setForm({ ...form, party_id: v })} type="client" /></div>
                <div><Label>Vehicle</Label><VehicleCombobox value={form.vehicle_id} onChange={v => setForm({ ...form, vehicle_id: v })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input value={form.from_city} onChange={e => setForm({ ...form, from_city: e.target.value })} /></div>
                  <div><Label>To</Label><Input value={form.to_city} onChange={e => setForm({ ...form, to_city: e.target.value })} /></div>
                </div>
                <div><Label>Material</Label><Input value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Weight (t)</Label><Input type="number" value={form.weight_tons} onChange={e => setForm({ ...form, weight_tons: e.target.value })} /></div>
                  <div><Label>Freight (₹)</Label><Input type="number" value={form.freight_amount} onChange={e => setForm({ ...form, freight_amount: e.target.value })} /></div>
                </div>
                <div><Label>Advance (₹)</Label><Input type="number" value={form.advance_amount} onChange={e => setForm({ ...form, advance_amount: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Driver</Label><Input value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} /></div>
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
              <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
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
                  <TableCell className="text-right">{fmtINR(Number(r.freight_amount) - Number(r.advance_amount))}</TableCell>
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

      <OrderDetail id={detailId} onClose={() => { setDetailId(null); load(); }} onStatus={setStatus} onBilty={generateBilty} />
    </div>
  );
}

function OrderDetail({ id, onClose, onStatus, onBilty }: { id: string | null; onClose: () => void; onStatus: (id: string, s: string) => void; onBilty: (id: string) => void }) {
  const [data, setData] = useState<Row | null>(null);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: d } = await supabase.from("orders").select("id,order_no,from_city,to_city,freight_amount,advance_amount,status,bilty_no,pickup_at,delivered_at,created_at,parties(name),vehicles(number)").eq("id", id).maybeSingle();
      setData(d as never as Row);
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
              <div><div className="text-muted-foreground text-xs">Advance</div><div>{fmtINR(data.advance_amount)}</div></div>
              <div><div className="text-muted-foreground text-xs">Balance</div><div>{fmtINR(Number(data.freight_amount) - Number(data.advance_amount))}</div></div>
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

            <Button className="w-full" onClick={() => onBilty(data.id)}><FileText className="size-4 mr-1" /> {data.bilty_no ? `Print Bilty ${data.bilty_no}` : "Generate Bilty (LR)"}</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
