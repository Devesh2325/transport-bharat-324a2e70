import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { fmtINR, fmtDate } from "@/lib/queries";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices/")({ component: InvoicesPage });

interface Inv { id: string; invoice_no: string; invoice_date: string; total_amount: number; status: string; party_id: string | null; parties: { name: string } | null }

function InvoicesPage() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Inv[]>([]);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data: invs, error } = await supabase
        .from("invoices")
        .select("id,invoice_no,invoice_date,total_amount,status,party_id")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });
      if (error) { console.error(error); setRows([]); return; }
      const partyIds = Array.from(new Set((invs ?? []).map(i => i.party_id).filter(Boolean) as string[]));
      let partyMap: Record<string, string> = {};
      if (partyIds.length) {
        const { data: parties } = await supabase.from("parties").select("id,name").in("id", partyIds);
        partyMap = Object.fromEntries((parties ?? []).map(p => [p.id, p.name]));
      }
      setRows((invs ?? []).map(i => ({ ...i, parties: i.party_id ? { name: partyMap[i.party_id] ?? "—" } : null })) as Inv[]);
    })();
  }, [company?.id]);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="GST tax invoices auto-generated from orders." />
      <div className="p-6 md:p-8">
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Party</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No invoices yet. Generate one from an Order.</TableCell></TableRow>}
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.invoice_no}</TableCell>
                  <TableCell>{fmtDate(r.invoice_date)}</TableCell>
                  <TableCell>{r.parties?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtINR(r.total_amount)}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell><Link to="/invoices/$invoiceId" params={{ invoiceId: r.id }}><Button size="sm" variant="outline"><Printer className="size-3 mr-1" /> View / Print</Button></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
