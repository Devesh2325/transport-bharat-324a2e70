import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtINR, fmtDate, exportXLSX } from "@/lib/queries";
import { Plus, Wallet, Users as UsersIcon, Receipt, FileSpreadsheet, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({ component: ExpensesPage });

type Category = "employee_salary" | "fuel" | "vehicle_maintenance" | "toll" | "office" | "misc";
const CATEGORIES: { v: Category; label: string }[] = [
  { v: "employee_salary", label: "Employee Salary" },
  { v: "fuel", label: "Fuel" },
  { v: "vehicle_maintenance", label: "Vehicle Maintenance" },
  { v: "toll", label: "Toll Charges" },
  { v: "office", label: "Office Expenses" },
  { v: "misc", label: "Misc Expenses" },
];
const catLabel = (c: string) => CATEGORIES.find(x => x.v === c)?.label ?? c;

interface Employee { id: string; name: string; phone: string | null; email: string | null; designation: string | null; monthly_salary: number; joined_at: string | null; active: boolean }
interface Expense { id: string; category: Category; amount: number; expense_date: string; description: string | null; paid_by: string | null; reference: string | null; employee_id: string | null; vehicle_id: string | null; employees: { name: string } | null }

function ExpensesPage() {
  return (
    <div>
      <PageHeader title="Expenses" subtitle="Daily expenses, employee management and salary payments." />
      <div className="p-6 md:p-8">
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily"><Receipt className="size-4 mr-1" /> Daily Expenses</TabsTrigger>
            <TabsTrigger value="employees"><UsersIcon className="size-4 mr-1" /> Employees</TabsTrigger>
            <TabsTrigger value="salary"><Wallet className="size-4 mr-1" /> Salary Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4"><DailyExpenses /></TabsContent>
          <TabsContent value="employees" className="mt-4"><Employees /></TabsContent>
          <TabsContent value="salary" className="mt-4"><SalaryPayments /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DailyExpenses() {
  const { company, user } = useAuth();
  const [rows, setRows] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    category: "fuel" as Category, amount: "", expense_date: today, description: "",
    paid_by: "", reference: "", employee_id: "" as string,
  });

  const load = async () => {
    if (!company) return;
    let q = supabase.from("expenses").select("*,employees(name)").eq("company_id", company.id).order("expense_date", { ascending: false });
    if (filterCat !== "all") q = q.eq("category", filterCat as Category);
    if (from) q = q.gte("expense_date", from);
    if (to) q = q.lte("expense_date", to);
    const { data } = await q;
    setRows((data ?? []) as never as Expense[]);
    const { data: emps } = await supabase.from("employees").select("*").eq("company_id", company.id).eq("active", true).order("name");
    setEmployees((emps ?? []) as Employee[]);
  };
  useEffect(() => { load(); }, [company?.id, filterCat, from, to]);

  const submit = async () => {
    if (!company || !user) return;
    if (!f.amount || Number(f.amount) <= 0) return toast.error("Amount required");
    const { error } = await supabase.from("expenses").insert({
      company_id: company.id, category: f.category, amount: Number(f.amount),
      expense_date: f.expense_date, description: f.description || null, paid_by: f.paid_by || null,
      reference: f.reference || null, employee_id: f.employee_id || null, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Expense recorded");
    setOpen(false);
    setF({ category: "fuel", amount: "", expense_date: today, description: "", paid_by: "", reference: "", employee_id: "" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const total = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows]);
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => m.set(r.category, (m.get(r.category) ?? 0) + Number(r.amount || 0)));
    return Array.from(m.entries());
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><Label>Category</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-44" /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-44" /></div>
        <Button variant="outline" size="sm" onClick={() => exportXLSX(`expenses-${today}`, [{
          name: "Expenses",
          rows: rows.map(r => ({ Date: r.expense_date, Category: catLabel(r.category), Amount: Number(r.amount), Description: r.description ?? "", Employee: r.employees?.name ?? "", PaidBy: r.paid_by ?? "", Ref: r.reference ?? "" })),
        }])}><FileSpreadsheet className="size-4 mr-1" /> Excel</Button>
        <div className="ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> Record Expense</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New Expense</SheetTitle></SheetHeader>
              <div className="grid gap-3 mt-4">
                <div><Label>Category</Label>
                  <Select value={f.category} onValueChange={v => setF({ ...f, category: v as Category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {f.category === "employee_salary" && (
                  <div><Label>Employee</Label>
                    <Select value={f.employee_id} onValueChange={v => setF({ ...f, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} · {fmtINR(e.monthly_salary)}/mo</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (₹)</Label><Input type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
                  <div><Label>Date</Label><Input type="date" value={f.expense_date} onChange={e => setF({ ...f, expense_date: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Textarea rows={2} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Paid by</Label><Input value={f.paid_by} onChange={e => setF({ ...f, paid_by: e.target.value })} placeholder="Cash / Bank" /></div>
                  <div><Label>Reference</Label><Input value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} placeholder="Bill / UPI ref" /></div>
                </div>
              </div>
              <SheetFooter className="mt-4"><Button onClick={submit}>Save Expense</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total ({rows.length} items)</div>
          <div className="font-display font-bold text-2xl">{fmtINR(total)}</div>
        </div>
        {byCat.slice(0, 2).map(([cat, amt]) => (
          <div key={cat} className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{catLabel(cat)}</div>
            <div className="font-display font-bold text-2xl">{fmtINR(amt)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>
            <TableHead>Employee</TableHead><TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No expenses recorded for this period.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{fmtDate(r.expense_date)}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{catLabel(r.category)}</span></TableCell>
                <TableCell className="text-sm">{r.description ?? "—"}</TableCell>
                <TableCell>{r.employees?.name ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono">{r.reference ?? "—"}</TableCell>
                <TableCell className="text-right font-medium">{fmtINR(r.amount)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Employees() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Employee | null>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", designation: "", monthly_salary: "", joined_at: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("employees").select("*").eq("company_id", company.id).order("name");
    setRows((data ?? []) as Employee[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const openNew = () => {
    setEdit(null);
    setF({ name: "", phone: "", email: "", designation: "", monthly_salary: "", joined_at: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEdit(e);
    setF({ name: e.name, phone: e.phone ?? "", email: e.email ?? "", designation: e.designation ?? "", monthly_salary: String(e.monthly_salary ?? ""), joined_at: e.joined_at ?? new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const submit = async () => {
    if (!company) return;
    if (!f.name.trim()) return toast.error("Name required");
    const payload = { name: f.name, phone: f.phone || null, email: f.email || null, designation: f.designation || null, monthly_salary: Number(f.monthly_salary || 0), joined_at: f.joined_at || null };
    const { error } = edit
      ? await supabase.from("employees").update(payload).eq("id", edit.id)
      : await supabase.from("employees").insert({ ...payload, company_id: company.id });
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); load();
  };

  const toggleActive = async (e: Employee) => {
    const { error } = await supabase.from("employees").update({ active: !e.active }).eq("id", e.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openNew}><Plus className="size-4 mr-1" /> Add Employee</Button></div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Phone</TableHead>
            <TableHead>Joined</TableHead><TableHead className="text-right">Salary</TableHead>
            <TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No employees yet.</TableCell></TableRow>}
            {rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm">{r.designation ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.phone ?? "—"}</TableCell>
                <TableCell className="text-xs">{r.joined_at ? fmtDate(r.joined_at) : "—"}</TableCell>
                <TableCell className="text-right">{fmtINR(r.monthly_salary)}</TableCell>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.active ? "Active" : "Inactive"}</span></TableCell>
                <TableCell onClick={ev => ev.stopPropagation()}><Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>{r.active ? "Deactivate" : "Activate"}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? "Edit Employee" : "New Employee"}</SheetTitle></SheetHeader>
          <div className="grid gap-3 mt-4">
            <div><Label>Name</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
            </div>
            <div><Label>Designation</Label><Input value={f.designation} onChange={e => setF({ ...f, designation: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly Salary (₹)</Label><Input type="number" value={f.monthly_salary} onChange={e => setF({ ...f, monthly_salary: e.target.value })} /></div>
              <div><Label>Joined</Label><Input type="date" value={f.joined_at} onChange={e => setF({ ...f, joined_at: e.target.value })} /></div>
            </div>
          </div>
          <SheetFooter className="mt-4"><Button onClick={submit}>Save</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SalaryPayments() {
  const { company, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ employee_id: "", amount: "", expense_date: today, reference: "", description: "" });

  const load = async () => {
    if (!company) return;
    const { data: emps } = await supabase.from("employees").select("*").eq("company_id", company.id).eq("active", true).order("name");
    setEmployees((emps ?? []) as Employee[]);
    const { data: pays } = await supabase.from("expenses").select("*,employees(name)").eq("company_id", company.id).eq("category", "employee_salary").order("expense_date", { ascending: false }).limit(100);
    setHistory((pays ?? []) as never as Expense[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const pay = async () => {
    if (!company || !user) return;
    if (!f.employee_id) return toast.error("Choose employee");
    if (!f.amount || Number(f.amount) <= 0) return toast.error("Amount required");
    const emp = employees.find(e => e.id === f.employee_id);
    const { error } = await supabase.from("expenses").insert({
      company_id: company.id, category: "employee_salary", amount: Number(f.amount),
      expense_date: f.expense_date, employee_id: f.employee_id,
      description: f.description || `Salary to ${emp?.name ?? ""}`,
      reference: f.reference || null, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Salary paid");
    setOpen(false);
    setF({ employee_id: "", amount: "", expense_date: today, reference: "", description: "" });
    load();
  };

  const selectedEmp = employees.find(e => e.id === f.employee_id);
  useEffect(() => { if (selectedEmp && !f.amount) setF(s => ({ ...s, amount: String(selectedEmp.monthly_salary || "") })); /* eslint-disable-line */ }, [f.employee_id]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="size-4 mr-1" /> Pay Salary</Button></SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Pay Salary</SheetTitle></SheetHeader>
            <div className="grid gap-3 mt-4">
              <div><Label>Employee</Label>
                <Select value={f.employee_id} onValueChange={v => setF({ ...f, employee_id: v, amount: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} · {fmtINR(e.monthly_salary)}/mo</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (₹)</Label><Input type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" value={f.expense_date} onChange={e => setF({ ...f, expense_date: e.target.value })} /></div>
              </div>
              <div><Label>Note</Label><Input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="e.g. May 2026 salary" /></div>
              <div><Label>Reference</Label><Input value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} placeholder="UPI / Cheque no." /></div>
            </div>
            <SheetFooter className="mt-4"><Button onClick={pay}>Record Payment</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Note</TableHead>
            <TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {history.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No salary payments yet.</TableCell></TableRow>}
            {history.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{fmtDate(r.expense_date)}</TableCell>
                <TableCell>{r.employees?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">{r.description ?? "—"}</TableCell>
                <TableCell className="text-xs font-mono">{r.reference ?? "—"}</TableCell>
                <TableCell className="text-right font-medium">{fmtINR(r.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
