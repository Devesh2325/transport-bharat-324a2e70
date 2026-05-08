import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtINR, exportXLSX, exportPDF } from "@/lib/queries";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

interface MonthRow { month: string; revenue: number; received: number; paid: number }
interface OutstRow { party_id: string; party_name: string; billed: number; received: number; outstanding: number }

function ReportsPage() {
  const { company } = useAuth();
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [outst, setOutst] = useState<OutstRow[]>([]);
  const [statusMix, setStatusMix] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data: m } = await supabase.rpc("report_revenue_by_month", { _company_id: company.id });
      setMonths((m ?? []) as MonthRow[]);
      const { data: o } = await supabase.rpc("report_party_outstanding", { _company_id: company.id });
      setOutst((o ?? []) as OutstRow[]);
      const { data: ord } = await supabase.from("orders").select("status").eq("company_id", company.id);
      const counts: Record<string, number> = {};
      (ord ?? []).forEach((r: { status: string }) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
      setStatusMix(Object.entries(counts).map(([name, value]) => ({ name, value })));
    })();
  }, [company?.id]);

  const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue, outstanding, and operational analytics." />
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-display font-semibold mb-4">Revenue & cash flow by month</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmtINR(Number(v))} />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" name="Billed" />
                <Bar dataKey="received" fill="#10b981" name="Received" />
                <Bar dataKey="paid" fill="#ef4444" name="Paid out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-display font-semibold mb-4">Order status mix</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                  {statusMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Party-wise outstanding</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Party</TableHead><TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Received</TableHead><TableHead className="text-right">Outstanding</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {outst.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data yet.</TableCell></TableRow>}
              {outst.map(r => (
                <TableRow key={r.party_id}>
                  <TableCell>{r.party_name}</TableCell>
                  <TableCell className="text-right">{fmtINR(r.billed)}</TableCell>
                  <TableCell className="text-right">{fmtINR(r.received)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtINR(r.outstanding)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
