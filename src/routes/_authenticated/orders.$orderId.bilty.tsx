import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtINR, fmtDate, downloadElementAsPDF } from "@/lib/queries";
import { Printer, Pencil, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$orderId/bilty")({ component: BiltyPage });

interface BiltyData {
  id: string; order_no: string; bilty_no: string | null; from_city: string | null; to_city: string | null;
  material: string | null; weight_tons: number | null; freight_amount: number; advance_amount: number;
  driver_name: string | null; driver_phone: string | null; created_at: string; notes: string | null;
  parties: { name: string; gst: string | null; address: string | null; phone: string | null } | null;
  vehicles: { number: string } | null;
}

function BiltyPage() {
  const { orderId } = Route.useParams();
  const { company, user, roles } = useAuth();
  const isAdmin = roles.includes("company_admin") || roles.includes("super_admin") || roles.includes("agent");
  const [data, setData] = useState<BiltyData | null>(null);
  const [tpl, setTpl] = useState<string>("standard");
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("orders")
      .select("id,order_no,bilty_no,from_city,to_city,material,weight_tons,freight_amount,advance_amount,driver_name,driver_phone,created_at,notes,parties(name,gst,address,phone),vehicles(number)")
      .eq("id", orderId).maybeSingle();
    setData(data as never);
  };
  useEffect(() => { load(); }, [orderId]);
  useEffect(() => { if (company) setTpl((company as never as { bilty_template?: string })?.bilty_template ?? "standard"); }, [company?.id]);

  if (!data) return <div className="p-8">Loading…</div>;
  const balance = Number(data.freight_amount) - Number(data.advance_amount);
  const brand = company?.brand_primary || "#1d4ed8";

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <style>{`@media print { .no-print { display: none !important; } @page { size: ${tpl === "thermal" ? "80mm auto" : "A4"}; margin: ${tpl === "thermal" ? "4mm" : "10mm"}; } }`}</style>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end gap-2 mb-3 no-print">
          <Select value={tpl} onValueChange={setTpl}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard (A4)</SelectItem>
              <SelectItem value="fullpage">Full-page detailed</SelectItem>
              <SelectItem value="thermal">Thermal (80mm)</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild><Button variant="outline"><Pencil className="size-4 mr-1" /> Edit</Button></DialogTrigger>
              <EditBilty data={data} userId={user?.id ?? ""} companyId={company?.id ?? ""} onClose={() => { setEditOpen(false); load(); }} />
            </Dialog>
          )}
          <Button onClick={() => window.print()}><Printer className="size-4 mr-1" /> Print / Save PDF</Button>
        </div>

        {tpl === "thermal" ? (
          <ThermalBilty data={data} company={company} balance={balance} />
        ) : tpl === "fullpage" ? (
          <FullPageBilty data={data} company={company} balance={balance} brand={brand} />
        ) : (
          <StandardBilty data={data} company={company} balance={balance} brand={brand} />
        )}
      </div>
    </div>
  );
}

function StandardBilty({ data, company, balance, brand }: { data: BiltyData; company: { name: string; logo_url: string | null } | null; balance: number; brand: string }) {
  return (
    <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: brand }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: brand, color: "white" }}>
        <div className="flex items-center gap-3">
          {company?.logo_url && <img src={company.logo_url} alt="" className="h-10 bg-white p-1 rounded" />}
          <div>
            <div className="font-bold text-xl">{company?.name}</div>
            <div className="text-xs opacity-80">Lorry Receipt (Bilty / LR)</div>
            <div className="text-xs opacity-80">{(company as never as { address?: string })?.address ?? ""}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">Bilty No.</div>
          <div className="font-mono font-bold">{data.bilty_no ?? "—"}</div>
          <div className="text-xs opacity-80 mt-1">{fmtDate(data.created_at)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b">
        <div className="p-4 border-r">
          <div className="text-xs uppercase text-gray-500">Consignor / Client</div>
          <div className="font-semibold">{data.parties?.name ?? "—"}</div>
          <div className="text-xs text-gray-600 whitespace-pre-line">{data.parties?.address}</div>
          {data.parties?.gst && <div className="text-xs">GST: {data.parties.gst}</div>}
        </div>
        <div className="p-4">
          <div className="text-xs uppercase text-gray-500">Order</div>
          <div className="font-mono">{data.order_no}</div>
          <div className="text-xs text-gray-600 mt-2">From → To</div>
          <div>{data.from_city} → {data.to_city}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b text-sm">
        <div className="p-4 border-r"><div className="text-xs text-gray-500">Vehicle</div><div className="font-semibold">{data.vehicles?.number ?? "—"}</div></div>
        <div className="p-4 border-r"><div className="text-xs text-gray-500">Driver</div><div>{data.driver_name ?? "—"}</div><div className="text-xs">{data.driver_phone}</div></div>
        <div className="p-4"><div className="text-xs text-gray-500">Material / Weight</div><div>{data.material ?? "—"}</div><div className="text-xs">{data.weight_tons ?? "—"} t</div></div>
      </div>
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-1.5">Freight</td><td className="text-right font-semibold">{fmtINR(data.freight_amount)}</td></tr>
            <tr><td className="py-1.5">Advance</td><td className="text-right">{fmtINR(data.advance_amount)}</td></tr>
            <tr className="border-t"><td className="py-2 font-bold">Balance Due</td><td className="text-right font-bold text-lg" style={{ color: brand }}>{fmtINR(balance)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 border-t text-xs text-gray-600">
        <div className="p-4 border-r h-24"><div className="mb-8">Consignor signature</div></div>
        <div className="p-4 h-24 text-right"><div className="mb-8">For {company?.name}</div></div>
      </div>
    </div>
  );
}

function FullPageBilty({ data, company, balance, brand }: { data: BiltyData; company: { name: string; logo_url: string | null } | null; balance: number; brand: string }) {
  return (
    <div className="border-2 rounded-lg overflow-hidden text-sm" style={{ borderColor: brand }}>
      <div className="px-6 py-5 text-center border-b-2" style={{ borderColor: brand }}>
        {company?.logo_url && <img src={company.logo_url} alt="" className="h-14 mx-auto mb-2" />}
        <div className="font-bold text-2xl" style={{ color: brand }}>{company?.name}</div>
        <div className="text-xs">{(company as never as { address?: string })?.address}</div>
        <div className="text-xs">{(company as never as { phone?: string })?.phone} · {(company as never as { email?: string })?.email}</div>
        {(company as never as { gst_number?: string })?.gst_number && <div className="text-xs">GSTIN: {(company as never as { gst_number?: string })?.gst_number}</div>}
      </div>
      <div className="px-6 py-2 flex justify-between items-center text-sm font-semibold" style={{ background: brand + "15" }}>
        <div>LORRY RECEIPT (LR/BILTY)</div>
        <div>No. <span className="font-mono">{data.bilty_no ?? "—"}</span> · {fmtDate(data.created_at)}</div>
      </div>
      <div className="grid grid-cols-2 border-b">
        <div className="p-4 border-r"><div className="text-xs uppercase text-gray-500">Consignor</div><div className="font-bold">{data.parties?.name}</div><div className="text-xs whitespace-pre-line">{data.parties?.address}</div>{data.parties?.gst && <div className="text-xs">GST: {data.parties.gst}</div>}</div>
        <div className="p-4"><div className="text-xs uppercase text-gray-500">Consignee / Delivery</div><div>{data.to_city}</div></div>
      </div>
      <div className="grid grid-cols-4 border-b">
        <Cell label="From" value={data.from_city ?? "—"} />
        <Cell label="To" value={data.to_city ?? "—"} />
        <Cell label="Vehicle" value={data.vehicles?.number ?? "—"} />
        <Cell label="Order" value={data.order_no} />
        <Cell label="Driver" value={data.driver_name ?? "—"} />
        <Cell label="Driver Phone" value={data.driver_phone ?? "—"} />
        <Cell label="Material" value={data.material ?? "—"} />
        <Cell label="Weight (t)" value={String(data.weight_tons ?? "—")} />
      </div>
      <table className="w-full">
        <thead style={{ background: brand + "10" }}><tr><th className="p-2 text-left">Particulars</th><th className="p-2 text-right">Amount (₹)</th></tr></thead>
        <tbody>
          <tr className="border-t"><td className="p-2">Freight Charges</td><td className="p-2 text-right">{fmtINR(data.freight_amount)}</td></tr>
          <tr className="border-t"><td className="p-2">Advance Received</td><td className="p-2 text-right">({fmtINR(data.advance_amount)})</td></tr>
          <tr className="border-t font-bold text-lg" style={{ color: brand }}><td className="p-2">Balance Due on Delivery</td><td className="p-2 text-right">{fmtINR(balance)}</td></tr>
        </tbody>
      </table>
      {data.notes && <div className="border-t p-3 text-xs"><b>Remarks:</b> {data.notes}</div>}
      <div className="grid grid-cols-3 border-t text-xs">
        <div className="p-4 border-r h-24">Consignor signature</div>
        <div className="p-4 border-r h-24 text-center">Driver signature</div>
        <div className="p-4 h-24 text-right">For {company?.name}<br /><br />Authorised Signatory</div>
      </div>
    </div>
  );
}

function ThermalBilty({ data, company, balance }: { data: BiltyData; company: { name: string } | null; balance: number }) {
  return (
    <div className="mx-auto text-xs font-mono" style={{ maxWidth: "80mm", padding: "4mm" }}>
      <div className="text-center font-bold">{company?.name}</div>
      <div className="text-center">LR / BILTY</div>
      <div className="border-t border-dashed my-1" />
      <div>Bilty: {data.bilty_no ?? "—"}</div>
      <div>Date : {fmtDate(data.created_at)}</div>
      <div>Order: {data.order_no}</div>
      <div className="border-t border-dashed my-1" />
      <div>From : {data.from_city}</div>
      <div>To   : {data.to_city}</div>
      <div>Veh  : {data.vehicles?.number}</div>
      <div>Drv  : {data.driver_name}</div>
      <div>Mat  : {data.material} ({data.weight_tons}t)</div>
      <div>Party: {data.parties?.name}</div>
      <div className="border-t border-dashed my-1" />
      <div className="flex justify-between"><span>Freight</span><span>{fmtINR(data.freight_amount)}</span></div>
      <div className="flex justify-between"><span>Advance</span><span>{fmtINR(data.advance_amount)}</span></div>
      <div className="flex justify-between font-bold border-t border-dashed pt-1"><span>Balance</span><span>{fmtINR(balance)}</span></div>
      <div className="border-t border-dashed my-1" />
      <div className="text-center">Thank You</div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return <div className="p-3 border-r border-b last:border-r-0"><div className="text-xs text-gray-500">{label}</div><div className="font-medium">{value}</div></div>;
}

function EditBilty({ data, userId, companyId, onClose }: { data: BiltyData; userId: string; companyId: string; onClose: () => void }) {
  const [f, setF] = useState({
    from_city: data.from_city ?? "", to_city: data.to_city ?? "",
    material: data.material ?? "", weight_tons: data.weight_tons ?? 0,
    freight_amount: data.freight_amount, advance_amount: data.advance_amount,
    driver_name: data.driver_name ?? "", driver_phone: data.driver_phone ?? "",
    notes: data.notes ?? "",
  });

  const save = async () => {
    const before = {
      from_city: data.from_city, to_city: data.to_city, material: data.material,
      weight_tons: data.weight_tons, freight_amount: data.freight_amount,
      advance_amount: data.advance_amount, driver_name: data.driver_name,
      driver_phone: data.driver_phone, notes: data.notes,
    };
    const { error } = await supabase.from("orders").update({
      from_city: f.from_city, to_city: f.to_city, material: f.material,
      weight_tons: Number(f.weight_tons) || null,
      freight_amount: Number(f.freight_amount), advance_amount: Number(f.advance_amount),
      driver_name: f.driver_name, driver_phone: f.driver_phone, notes: f.notes,
    }).eq("id", data.id);
    if (error) return toast.error(error.message);
    await supabase.from("bilty_audits").insert({
      company_id: companyId, order_id: data.id, changed_by: userId,
      changes: { before, after: f } as never,
    });
    toast.success("Bilty updated");
    onClose();
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Edit Bilty {data.bilty_no}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>From</Label><Input value={f.from_city} onChange={e => setF({ ...f, from_city: e.target.value })} /></div>
        <div><Label>To</Label><Input value={f.to_city} onChange={e => setF({ ...f, to_city: e.target.value })} /></div>
        <div><Label>Material</Label><Input value={f.material} onChange={e => setF({ ...f, material: e.target.value })} /></div>
        <div><Label>Weight (t)</Label><Input type="number" value={f.weight_tons} onChange={e => setF({ ...f, weight_tons: Number(e.target.value) })} /></div>
        <div><Label>Freight (₹)</Label><Input type="number" value={f.freight_amount} onChange={e => setF({ ...f, freight_amount: Number(e.target.value) })} /></div>
        <div><Label>Advance (₹)</Label><Input type="number" value={f.advance_amount} onChange={e => setF({ ...f, advance_amount: Number(e.target.value) })} /></div>
        <div><Label>Driver</Label><Input value={f.driver_name} onChange={e => setF({ ...f, driver_name: e.target.value })} /></div>
        <div><Label>Driver phone</Label><Input value={f.driver_phone} onChange={e => setF({ ...f, driver_phone: e.target.value })} /></div>
        <div className="col-span-2"><Label>Remarks</Label><Input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={save}>Save changes</Button></DialogFooter>
    </DialogContent>
  );
}
