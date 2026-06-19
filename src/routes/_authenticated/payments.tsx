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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartyCombobox } from "@/components/PartyCombobox";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtINR, fmtDate } from "@/lib/queries";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payments")({ component: PaymentsPage });

interface PRow {
  id: string; amount: number; mode: string; reference: string | null; paid_at: string;
  direction: string; parties: { name: string } | null; orders: { order_no: string } | null;
}

const empty = { direction: "receivable" as "receivable" | "payable", party_id: null as string | null, order_id: "", invoice_id: "", bank_account_id: "", amount: "", mode: "bank", reference: "", paid_at: new Date().toISOString().slice(0,10) };

function PaymentsPage() {
  const { company, user } = useAuth();
  const [rows, setRows] = useState<PRow[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_no: string; party_id: string | null }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoice_no: string; party_id: string | null }[]>([]);
  const [banks, setBanks] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [tab, setTab] = useState<"receivable" | "payable">("receivable");

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("payments")
      .select("id,amount,mode,reference,paid_at,direction,parties(name),orders(order_no)")
      .eq("company_id", company.id).order("paid_at", { ascending: false });
    setRows((data ?? []) as never as PRow[]);
    const [{ data: ord }, { data: inv }, { data: bk }] = await Promise.all([
      supabase.from("orders").select("id,order_no,party_id").eq("company_id", company.id),
      supabase.from("invoices").select("id,invoice_no,party_id").eq("company_id", company.id),
      supabase.from("bank_accounts").select("id,name").eq("company_id", company.id).order("name"),
    ]);
    setOrders(ord ?? []); setInvoices(inv ?? []); setBanks(bk ?? []);
  };
  useEffect(() => { load(); }, [company?.id]);

  const submit = async () => {
    if (!company || !user) return;
    const { error } = await supabase.from("payments").insert({
      company_id: company.id, direction: form.direction as never,
      party_id: form.party_id, order_id: form.order_id || null,
      invoice_id: form.invoice_id || null, bank_account_id: form.bank_account_id || null,
      amount: Number(form.amount), mode: form.mode as never, reference: form.reference,
      paid_at: new Date(form.paid_at).toISOString(), created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Payment recorded");
    setOpen(false); setForm(empty); load();
  };

  const totals = rows.reduce((acc, r) => {
    if (r.direction === "receivable") acc.received += Number(r.amount);
    else acc.paid += Number(r.amount);
    return acc;
  }, { received: 0, paid: 0 });

  const filtered = rows.filter(r => r.direction === tab);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track receivables from clients and payables to transporters."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> Record Payment</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>Record Payment</SheetTitle></SheetHeader>
              <div className="grid gap-3 mt-4">
                <div><Label>Direction</Label>
                  <Select value={form.direction} onValueChange={v => setForm({ ...empty, direction: v as never, paid_at: form.paid_at })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receivable">Received from client</SelectItem>
                      <SelectItem value="payable">Paid to transporter</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.direction === "receivable"
                      ? "Money coming IN from a client against an invoice or order."
                      : "Money going OUT to a transporter against an order."}
                  </p>
                </div>
                <div>
                  <Label>{form.direction === "receivable" ? "Client" : "Transporter"}</Label>
                  <PartyCombobox value={form.party_id} onChange={v => setForm({ ...form, party_id: v, order_id: "", invoice_id: "" })} type={form.direction === "receivable" ? "client" : "transporter"} />
                </div>
                {form.party_id && (
                  <div><Label>Order (optional)</Label>
                    <Select value={form.order_id} onValueChange={v => setForm({ ...form, order_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Link an order" /></SelectTrigger>
                      <SelectContent>
                        {orders.filter(o => o.party_id === form.party_id).length === 0 && <div className="p-2 text-xs text-muted-foreground">No orders for this party</div>}
                        {orders.filter(o => o.party_id === form.party_id).map(o => <SelectItem key={o.id} value={o.id}>{o.order_no}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.direction === "receivable" && form.party_id && (
                  <div><Label>Invoice (optional)</Label>
                    <Select value={form.invoice_id} onValueChange={v => setForm({ ...form, invoice_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Link an invoice" /></SelectTrigger>
                      <SelectContent>
                        {invoices.filter(i => i.party_id === form.party_id).length === 0 && <div className="p-2 text-xs text-muted-foreground">No invoices for this client</div>}
                        {invoices.filter(i => i.party_id === form.party_id).map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_no}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(form.mode === "bank" || form.mode === "upi" || form.mode === "cheque") && (
                  <div><Label>Bank Account</Label>
                    <Select value={form.bank_account_id} onValueChange={v => setForm({ ...form, bank_account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                      <SelectContent>
                        {banks.length === 0 && <div className="p-2 text-xs text-muted-foreground">Add bank in Master Data</div>}
                        {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Mode</Label>
                    <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["cash","upi","bank","cheque"].map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Reference</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="UTR / Cheque no." /></div>
                <div><Label>Date</Label><Input type="date" value={form.paid_at} onChange={e => setForm({ ...form, paid_at: e.target.value })} /></div>
              </div>
              <SheetFooter className="mt-4"><Button onClick={submit}>Save</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        } />

      <div className="p-6 md:p-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI icon={<TrendingUp className="size-5" />} label="Received" value={fmtINR(totals.received)} tone="emerald" />
          <KPI icon={<TrendingDown className="size-5" />} label="Paid out" value={fmtINR(totals.paid)} tone="rose" />
          <KPI icon={<Wallet className="size-5" />} label="Net" value={fmtINR(totals.received - totals.paid)} tone="indigo" />
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as never)}>
          <TabsList>
            <TabsTrigger value="receivable">Receivables</TabsTrigger>
            <TabsTrigger value="payable">Payables</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Party</TableHead><TableHead>Order</TableHead>
                  <TableHead>Mode</TableHead><TableHead>Reference</TableHead><TableHead>Direction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No payments yet.</TableCell></TableRow>}
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{fmtDate(r.paid_at)}</TableCell>
                      <TableCell>{r.parties?.name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.orders?.order_no ?? "—"}</TableCell>
                      <TableCell className="capitalize">{r.mode}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reference ?? "—"}</TableCell>
                      <TableCell><StatusBadge value={r.direction} /></TableCell>
                      <TableCell className="text-right font-semibold">{fmtINR(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-600",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-600",
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-600",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[tone]} p-5`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">{icon}{label}</div>
      <div className="mt-2 text-2xl font-display font-bold text-foreground">{value}</div>
    </div>
  );
}
