import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtINR, fmtDate } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/ledger")({ component: LedgerPage });

interface Entry { entry_date: string; ref: string; description: string; debit: number; credit: number }

function LedgerPage() {
  const { company } = useAuth();
  const [parties, setParties] = useState<{ id: string; name: string; type: string }[]>([]);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!company) return;
    supabase.from("parties").select("id,name,type").eq("company_id", company.id).order("name")
      .then(({ data }) => setParties(data ?? []));
  }, [company?.id]);

  useEffect(() => {
    if (!company || !partyId) { setEntries([]); return; }
    supabase.rpc("party_ledger", { _company_id: company.id, _party_id: partyId })
      .then(({ data }) => setEntries((data ?? []) as Entry[]));
  }, [company?.id, partyId]);

  let running = 0;
  const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);

  return (
    <div>
      <PageHeader title="Party Ledger" subtitle="Running statement of account for any party — clients, transporters, agents." />
      <div className="p-6 md:p-8 space-y-4">
        <Select value={partyId ?? undefined} onValueChange={setPartyId}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select a party" /></SelectTrigger>
          <SelectContent>
            {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name} <span className="text-muted-foreground text-xs">· {p.type}</span></SelectItem>)}
          </SelectContent>
        </Select>

        {partyId && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Total Debit (Billed)" value={fmtINR(totalDebit)} tone="rose" />
              <Stat label="Total Credit (Received/Paid)" value={fmtINR(totalCredit)} tone="emerald" />
              <Stat label="Outstanding Balance" value={fmtINR(totalDebit - totalCredit)} tone="indigo" />
            </div>
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Ref</TableHead><TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {entries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No transactions yet.</TableCell></TableRow>}
                  {entries.map((e, i) => {
                    running += Number(e.debit) - Number(e.credit);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{fmtDate(e.entry_date)}</TableCell>
                        <TableCell className="font-mono text-xs">{e.ref}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-right">{Number(e.debit) ? fmtINR(e.debit) : "—"}</TableCell>
                        <TableCell className="text-right">{Number(e.credit) ? fmtINR(e.credit) : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmtINR(running)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-700 dark:text-emerald-400",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-700 dark:text-rose-400",
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-700 dark:text-indigo-400",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[tone]} p-5`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-display font-bold text-foreground">{value}</div>
    </div>
  );
}
