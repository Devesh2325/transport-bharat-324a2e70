import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, ClipboardList, Wallet, BarChart3, Users, Settings, ShieldCheck, LogOut, Truck, Crown, Menu, Database, FileText, BookOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_FULL = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/ledger", label: "Party Ledger", icon: BookOpen },
  { to: "/masters", label: "Master Data", icon: Database },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

const NAV_TRANSPORTER = [
  { to: "/transporter", label: "My Loads", icon: Truck },
  { to: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { profile, company, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const isSuper = roles.includes("super_admin");
  const initials = (profile?.full_name || profile?.email || "U").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const planName = company?.plan?.name ?? "Free";

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center size-8 rounded-md bg-[var(--gradient-brand)]"><Truck className="size-4" /></span>
          TransFlow
        </div>
        {company && (
          <div className="mt-4 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
            <div className="text-xs uppercase tracking-wider opacity-60">Workspace</div>
            <div className="font-medium text-sm truncate">{company.name}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider rounded-full bg-accent text-accent-foreground px-2 py-0.5 font-semibold">
              <Crown className="size-3" /> {planName}
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((n) => {
          const active = loc.pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 opacity-80 hover:opacity-100"}`}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          );
        })}
        {isSuper && (
          <>
            <div className="mt-6 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider opacity-50">Platform</div>
            <Link to="/admin/companies" onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${loc.pathname.startsWith("/admin") ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 opacity-80 hover:opacity-100"}`}>
              <ShieldCheck className="size-4" /> Super Admin
            </Link>
          </>
        )}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-9 rounded-full bg-accent text-accent-foreground grid place-items-center font-semibold text-sm">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile?.full_name || profile?.email}</div>
            <div className="text-xs opacity-60 truncate capitalize">{roles[0]?.replace("_", " ")}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr] bg-background">
      <aside className="hidden md:block border-r border-sidebar-border">
        <SidebarContent />
      </aside>
      <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-card">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button size="icon" variant="ghost"><Menu className="size-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-72"><SidebarContent onNav={() => setOpen(false)} /></SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 font-display font-bold"><Truck className="size-4" /> TransFlow</div>
      </div>
      <main className="overflow-x-hidden">{children}</main>
    </div>
  );
}
