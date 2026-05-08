import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtINR, fmtDate } from "@/lib/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { Truck, Wallet, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transporter")({ component: TransporterPortal });

interface OrderRow {
  id: string; order_no: string; from_city: string | null; to_city: string | null;
  material: string | null; status: string; transporter_amount: number;
  pickup_at: string | null; delivered_at: string | null; bilty_no: string | null;
  vehicles: { number: string } | null;
}
interface PayRow { id: string; amount: number; paid_at: string; reference: string | null; mode: string }

function TransporterPortal() {
  const { company, profile } = useAuth();
  const [partyId, setPartyId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [payments, setPayments] = useState<PayRow[]>([]);

  useEffect(() => {
    if (!company || !profile?.email) return;
    (async () => {
      const { data: p } = await supabase.from("parties").select("id,name")
        .eq("company_id", company.id).eq("type", "transporter")
        .eq("email", profile.email).maybeSingle();
      if (!p) return;
      setPartyId(p.id); setPartyName(p.name);
      const { data: o } = await supabase.from("orders")
        .select("id,order_no,from_city,to_city,material,status,transporter_amount,pickup_at,delivered_at,bilty_no,vehicles(number)")
        .eq("company_id", company.id).eq("transporter_party_id", p.id)
        .order("created_at", { ascending: false });
      setOrders((o ?? []) as unknown as OrderRow[]);
      const { data: pay } = await supabase.from("payments")
        .select("id,amount,paid_at,reference,mode")
        .eq("company_id", company.id).eq("party_id", p.id).eq("direction", "payable")
        .order("paid_at", { ascending: false });
      setPayments((pay ?? []) as PayRow[]);
    })();
  }, [company?.id, profile?.email]);

  const totalAssigned = orders.reduce((s, o) => s + Number(o.transporter_amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = totalAssigned - totalPaid;
  const inTransit = orders.filter(o => o.status === "in_transit" || o.status === "loaded").length;
  const delivered = orders.filter(o => o.status === "delivered" || o.status === "completed").length;

  if (!profile?.email) return null;
  if (!partyId) {
    return (
      <div>
        <PageHeader title="Transporter Portal" subtitle="Track your loads, payments and dues." />
        <div className="p-8">
          <div className="rounded-2xl border border-dashed p-10 text-center max-w-xl mx-auto">
            <Truck className="size-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-display text-xl font-bold">Not linked yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account ({profile.email}) is not linked to a transporter party in this workspace.
              Ask the workspace admin to add a transporter party with your email so you can see assigned loads.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Assigned value", value: fmtINR(totalAssigned), icon: Truck, tone: "bg-primary/10 text-primary" },
    { label: "Paid", value: fmtINR(totalPaid), icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Pending", value: fmtINR(pending), icon: Wallet, tone: "bg-amber-500/10 text-amber-600" },
    { label: "In transit / Delivered", value: `${inTransit} / ${delivered}`, icon: Clock, tone: "bg-violet-500/10 text-violet-600" },
  ];

  return (
    <div>
      <PageHeader title="Transporter Portal" subtitle={`Welcome, ${partyName} — your loads, status and payments.`} />
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl border bg-card p-4">
              <div className={`inline-flex size-9 items-center justify-center rounded-lg ${c.tone}`}><c.icon className="size-4" /></div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-display text-xl font-bold">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b font-display font-semibold">Assigned loads</div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Bilty</TableHead><TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead><TableHead>Pickup</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Freight to you</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {orders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No loads assigned yet.</TableCell></TableRow>}
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.order_no}</TableCell>
                  <TableCell className="font-mono text-xs">{o.bilty_no ?? "—"}</TableCell>
                  <TableCell>{o.from_city ?? "—"} → {o.to_city ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{o.vehicles?.number ?? "—"}</TableCell>
                  <TableCell>{fmtDate(o.pickup_at)}</TableCell>
                  <TableCell><StatusBadge value={o.status} /></TableCell>
                  <TableCell className="text-right font-semibold">{fmtINR(o.transporter_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b font-display font-semibold">Payments received</div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No payments yet.</TableCell></TableRow>}
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{fmtDate(p.paid_at)}</TableCell>
                  <TableCell className="capitalize">{p.mode}</TableCell>
                  <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtINR(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
