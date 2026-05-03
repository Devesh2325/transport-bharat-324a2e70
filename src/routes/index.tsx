import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Receipt, Wallet, Users, Shield, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid place-items-center size-8 rounded-md bg-[var(--gradient-brand)] text-primary-foreground"><Truck className="size-4" /></span>
            TransFlow
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#why" className="hover:text-foreground transition-colors">Why TransFlow</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/signup"><Button size="sm">Start free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 [background:var(--gradient-hero)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Built for Indian transport brokers
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
            Move freight.<br />
            <span className="bg-clip-text text-transparent bg-[var(--gradient-brand)]">Not paperwork.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            TransFlow is a multi-tenant TMS for logistics brokers and transport agencies. Inquiries, rate negotiation, orders, bilty, GST invoices and payment tracking — one workspace per company.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gap-2">Start 14-day free trial <ArrowRight className="size-4" /></Button>
            </Link>
            <a href="#features"><Button size="lg" variant="outline">Explore features</Button></a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card · GST-ready · White-label friendly</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: "Inquiry → Order → Bilty", body: "Capture loads, negotiate rates with your team, dispatch trucks and auto-generate LR — all in one flow." },
            { icon: Receipt, title: "GST Invoicing", body: "Tax-compliant invoices with HSN codes, IGST/CGST split, and PDF download ready for the GST portal." },
            { icon: Wallet, title: "Payments & Ledger", body: "Track receivables from clients and payables to transporters. Bank-wise balances, party ledgers, daily cash flow." },
            { icon: Users, title: "Roles & Quotas", body: "Invite agents and finance users. Plan-aware seat limits. Granular role-based permissions per workspace." },
            { icon: Shield, title: "True Data Isolation", body: "Workspace-scoped row-level security. No company can ever see another tenant's data. Audit logs included." },
            { icon: BarChart3, title: "Reports that matter", body: "Profit per order, party-wise outstanding, user performance. Export to Excel and PDF in one click." },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all">
              <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-3 text-muted-foreground">Pay per workspace. Upgrade as you grow. Start free.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Free", price: "₹0", desc: "For evaluation", features: ["2 users", "200 MB storage", "Core inquiry & orders"] },
            { name: "Pro", price: "₹1,499", desc: "Per month, per workspace", features: ["10 users", "5 GB storage", "Reports + GST invoicing", "White-label branding"], featured: true },
            { name: "Enterprise", price: "Custom", desc: "Tailored to your scale", features: ["100+ users", "50 GB+ storage", "Custom domain", "Priority support"] },
          ].map((p) => (
            <div key={p.name} className={`rounded-2xl border p-8 ${p.featured ? "border-primary bg-card shadow-[var(--shadow-elegant)] scale-105" : "border-border bg-card"}`}>
              {p.featured && <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Most popular</div>}
              <h3 className="font-display text-2xl font-bold">{p.name}</h3>
              <div className="mt-4 text-4xl font-bold">{p.price}<span className="text-sm font-normal text-muted-foreground"> {p.name === "Pro" && "/mo"}</span></div>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((x) => <li key={x} className="flex gap-2"><span className="text-success">✓</span>{x}</li>)}
              </ul>
              <Link to="/signup" className="mt-8 block">
                <Button className="w-full" variant={p.featured ? "default" : "outline"}>Get started</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-7xl px-6 py-24 border-t border-border">
        <div className="rounded-3xl bg-[var(--gradient-brand)] text-primary-foreground p-12 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">Built for the Indian road.</h2>
          <p className="mt-4 max-w-2xl mx-auto opacity-90">From a single broker handling 5 trucks to an agency managing 200, TransFlow scales with you. INR-native, GST-ready, Hindi support coming soon.</p>
          <Link to="/signup" className="inline-block mt-8">
            <Button size="lg" variant="secondary">Create your workspace</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TransFlow SaaS · Built with care for logistics teams
      </footer>
    </div>
  );
}
