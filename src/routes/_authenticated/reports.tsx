import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtINR, exportXLSX, exportPDF } from "@/lib/queries";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

interface MonthRow { month: string; revenue: number; received: number; paid: number }
interface OutstRow { party_id: string; party_name: string; billed: number; received: number; outstanding: number }
interface ExpRow { id: string; category: string; amount: number; expense_date: string; description: string | null }

const CAT_LABEL: Record<string, string> = {
  employee_salary: "Employee Salary", fuel: "Fuel", vehicle_maintenance: "Vehicle Maintenance",
  toll: "Toll Charges", office: "Office Expenses", misc: "Miscellaneous",
};

function ReportsPage() {
  const { company } = useAuth();
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [outst, setOutst] = useState<OutstRow[]>([]);
  const [statusMix, setStatusMix] = useState<{ name: string; value: number }[]>([]);
  const [expenses, setExpenses] = useState<ExpRow[]>([]);

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
      const { data: ex } = await supabase.from("expenses").select("id,category,amount,expense_date,description").eq("company_id", company.id).order("expense_date", { ascending: false });
      setExpenses((ex ?? []) as ExpRow[]);
    })();
  }, [company?.id]);

  const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6"];

  const expByCat = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(e => m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount || 0)));
    return Array.from(m.entries()).map(([name, value]) => ({ name: CAT_LABEL[name] ?? name, value }));
  }, [expenses]);

  const expByMonth = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(e => {
      const k = (e.expense_date || "").slice(0, 7);
      m.set(k, (m.get(k) ?? 0) + Number(e.amount || 0));
    });
    return Array.from(m.entries()).sort().map(([month, total]) => ({ month, total }));
  }, [expenses]);

  const totalExp = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue, outstanding, expenses and operational analytics." actions={<>
        <Button variant="outline" size="sm" onClick={() => exportXLSX(`reports-${new Date().toISOString().slice(0,10)}`, [
          { name: "Revenue by month", rows: months as unknown as Record<string, unknown>[] },
          { name: "Party outstanding", rows: outst as unknown as Record<string, unknown>[] },
          { name: "Status mix", rows: statusMix as unknown as Record<string, unknown>[] },
          { name: "Expenses by category", rows: expByCat as unknown as Record<string, unknown>[] },
          { name: "Expenses by month", rows: expByMonth as unknown as Record<string, unknown>[] },
        ])}><FileSpreadsheet className="size-4 mr-1" /> Excel</Button>
        <Button variant="outline" size="sm" onClick={() => exportPDF(
          `outstanding-${new Date().toISOString().slice(0,10)}`,
          "Party-wise Outstanding",
          ["Party","Billed","Received","Outstanding"],
          outst.map(r => [r.party_name, fmtINR(r.billed), fmtINR(r.received), fmtINR(r.outstanding)]),
        )}><FileText className="size-4 mr-1" /> PDF</Button>
      </>} />

      <div className="p-6 md:p-8">
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">Revenue & Cash flow</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </TabsContent>

          <TabsContent value="outstanding" className="mt-6">
            <div className="rounded-xl border bg-card p-5">
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
          </TabsContent>

          <TabsContent value="expenses" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-display font-semibold mb-1">Expenses by category</h3>
                <p className="text-xs text-muted-foreground mb-3">Total {fmtINR(totalExp)}</p>
                <div className="h-72">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={expByCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                        {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmtINR(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-display font-semibold mb-4">Expenses by month</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={expByMonth}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => fmtINR(Number(v))} />
                      <Bar dataKey="total" fill="#f59e0b" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Recent expenses</h3>
                <Button size="sm" variant="outline" onClick={() => exportPDF(
                  `expenses-${new Date().toISOString().slice(0,10)}`, "Expense Report",
                  ["Date","Category","Description","Amount"],
                  expenses.map(e => [e.expense_date, CAT_LABEL[e.category] ?? e.category, e.description ?? "", fmtINR(e.amount)]),
                )}><FileText className="size-4 mr-1" /> PDF</Button>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Category</TableHead>
                  <TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {expenses.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No expenses recorded yet.</TableCell></TableRow>}
                  {expenses.slice(0, 50).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{e.expense_date}</TableCell>
                      <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{CAT_LABEL[e.category] ?? e.category}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{fmtINR(e.amount)}</TableCell>
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
