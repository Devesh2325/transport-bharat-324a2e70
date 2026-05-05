import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCombobox } from "@/components/ProductCombobox";
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
import { StatusBadge } from "@/components/StatusBadge";
import { fmtINR, fmtDate, nextDocNo } from "@/lib/queries";
import { Plus, Search, MessageSquarePlus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/inquiries")({ component: InquiriesPage });

interface Row {
  id: string; inquiry_no: string; from_city: string | null; to_city: string | null;
  material: string | null; vehicle_type: string | null; expected_rate: number | null;
  status: string; created_at: string; party_id: string | null;
  parties: { name: string } | null;
}

const empty = { party_id: null as string | null, product_id: null as string | null, from_city: "", to_city: "", material: "", vehicle_type: "", weight_tons: "", expected_rate: "", notes: "" };

function InquiriesPage() {
  const { company, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries").select("id,inquiry_no,from_city,to_city,material,vehicle_type,expected_rate,status,created_at,party_id,parties(name)")
      .eq("company_id", company.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as never as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [company?.id]);

  const submit = async () => {
    if (!company || !user) return;
    const inquiry_no = await nextDocNo(company.id, "INQ");
    const { error } = await supabase.from("inquiries").insert({
      company_id: company.id, inquiry_no, party_id: form.party_id, product_id: form.product_id,
      from_city: form.from_city, to_city: form.to_city, material: form.material,
      vehicle_type: form.vehicle_type,
      weight_tons: form.weight_tons ? Number(form.weight_tons) : null,
      expected_rate: form.expected_rate ? Number(form.expected_rate) : null,
      notes: form.notes, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`Inquiry ${inquiry_no} created`);
    setOpen(false); setForm(empty); load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = rows.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return r.inquiry_no.toLowerCase().includes(s) || r.parties?.name.toLowerCase().includes(s) || r.from_city?.toLowerCase().includes(s) || r.to_city?.toLowerCase().includes(s);
  });

  return (
    <div>
      <PageHeader title="Inquiries" subtitle="Capture incoming load requests and negotiate rates."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> New Inquiry</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New Inquiry</SheetTitle></SheetHeader>
              <div className="grid gap-3 mt-4">
                <div><Label>Party (Client)</Label><PartyCombobox value={form.party_id} onChange={v => setForm({ ...form, party_id: v })} type="client" /></div>
                <div><Label>Product</Label><ProductCombobox value={form.product_id} onChange={v => setForm({ ...form, product_id: v })} onPick={p => setForm(f => ({ ...f, material: p.name, expected_rate: f.expected_rate || (p.default_rate ? String(p.default_rate) : "") }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>From</Label><Input value={form.from_city} onChange={e => setForm({ ...form, from_city: e.target.value })} /></div>
                  <div><Label>To</Label><Input value={form.to_city} onChange={e => setForm({ ...form, to_city: e.target.value })} /></div>
                </div>
                <div><Label>Material</Label><Input value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Weight (tons)</Label><Input type="number" value={form.weight_tons} onChange={e => setForm({ ...form, weight_tons: e.target.value })} /></div>
                  <div><Label>Vehicle type</Label><Input value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} /></div>
                </div>
                <div><Label>Expected rate (₹)</Label><Input type="number" value={form.expected_rate} onChange={e => setForm({ ...form, expected_rate: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <SheetFooter className="mt-4"><Button onClick={submit}>Create</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        } />

      <div className="p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by no, party, city" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["new","quoted","negotiating","won","lost"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead><TableHead>Party</TableHead><TableHead>Route</TableHead>
                <TableHead>Material</TableHead><TableHead className="text-right">Expected</TableHead>
                <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Loading…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No inquiries yet. Click "New Inquiry" to start.</TableCell></TableRow>}
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetailId(r.id)}>
                  <TableCell className="font-mono text-xs">{r.inquiry_no}</TableCell>
                  <TableCell>{r.parties?.name ?? "—"}</TableCell>
                  <TableCell>{r.from_city ?? "—"} <ArrowRight className="inline size-3 mx-1 text-muted-foreground" /> {r.to_city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.material ?? "—"}</TableCell>
                  <TableCell className="text-right">{fmtINR(r.expected_rate)}</TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{fmtDate(r.created_at)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={v => setStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["new","quoted","negotiating","won","lost"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DetailSheet id={detailId} onClose={() => { setDetailId(null); load(); }} />
    </div>
  );
}

function DetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<Row | null>(null);
  const [quotes, setQuotes] = useState<{ id: string; quoted_rate: number | null; counter_rate: number | null; note: string | null; created_at: string }[]>([]);
  const [quoted, setQuoted] = useState(""); const [counter, setCounter] = useState(""); const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: d } = await supabase.from("inquiries").select("id,inquiry_no,from_city,to_city,material,vehicle_type,expected_rate,status,created_at,party_id,parties(name)").eq("id", id).maybeSingle();
      setData(d as never as Row);
      const { data: q } = await supabase.from("inquiry_quotes").select("id,quoted_rate,counter_rate,note,created_at").eq("inquiry_id", id).order("created_at");
      setQuotes(q ?? []);
    })();
  }, [id]);

  const addQuote = async () => {
    if (!id || !user || !data) return;
    const { data: row } = await supabase.from("inquiries").select("company_id").eq("id", id).single();
    if (!row) return;
    const { error } = await supabase.from("inquiry_quotes").insert({
      company_id: row.company_id, inquiry_id: id,
      quoted_rate: quoted ? Number(quoted) : null, counter_rate: counter ? Number(counter) : null,
      note, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    await supabase.from("inquiries").update({ status: "negotiating" as never }).eq("id", id);
    setQuoted(""); setCounter(""); setNote("");
    const { data: q } = await supabase.from("inquiry_quotes").select("id,quoted_rate,counter_rate,note,created_at").eq("inquiry_id", id).order("created_at");
    setQuotes(q ?? []);
    toast.success("Quote added");
  };

  return (
    <Sheet open={!!id} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Inquiry {data?.inquiry_no}</SheetTitle></SheetHeader>
        {data && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">Party</div><div>{data.parties?.name ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Status</div><StatusBadge value={data.status} /></div>
              <div><div className="text-muted-foreground text-xs">Route</div><div>{data.from_city} → {data.to_city}</div></div>
              <div><div className="text-muted-foreground text-xs">Expected</div><div>{fmtINR(data.expected_rate)}</div></div>
              <div><div className="text-muted-foreground text-xs">Material</div><div>{data.material ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Vehicle</div><div>{data.vehicle_type ?? "—"}</div></div>
            </div>

            <div>
              <div className="font-medium text-sm mb-2 flex items-center gap-2"><MessageSquarePlus className="size-4" /> Negotiation log</div>
              <div className="space-y-2">
                {quotes.length === 0 && <div className="text-xs text-muted-foreground">No quotes yet.</div>}
                {quotes.map(q => (
                  <div key={q.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{fmtDate(q.created_at)}</span></div>
                    <div className="mt-1">Quoted: <b>{fmtINR(q.quoted_rate)}</b> · Counter: <b>{fmtINR(q.counter_rate)}</b></div>
                    {q.note && <div className="text-xs text-muted-foreground mt-1">{q.note}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Quoted ₹" value={quoted} onChange={e => setQuoted(e.target.value)} />
                <Input type="number" placeholder="Counter ₹" value={counter} onChange={e => setCounter(e.target.value)} />
              </div>
              <Textarea className="mt-2" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
              <Button className="mt-2 w-full" onClick={addQuote}>Add quote</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
