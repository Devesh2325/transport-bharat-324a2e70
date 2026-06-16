import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Receipt, Wallet, Users, Shield, BarChart3, ArrowRight, FileText, Search, Banknote, Building2, Mail, Phone, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "TransFlow — TMS for Indian Transport Brokers & Agencies" },
      { name: "description", content: "Multi-tenant transport management for brokers: inquiries, orders, bilty, GST invoices, payments & ledgers — one workspace per company." },
      { property: "og:title", content: "TransFlow — Move freight, not paperwork" },
      { property: "og:description", content: "GST-ready TMS for Indian logistics brokers and transport agencies." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-40 bg-background/80">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid place-items-center size-8 rounded-md bg-[var(--gradient-brand)] text-primary-foreground"><Truck className="size-4" /></span>
            TransFlow
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
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
            <Link to="/signup"><Button size="lg" className="gap-2">Start 14-day free trial <ArrowRight className="size-4" /></Button></Link>
            <a href="#features"><Button size="lg" variant="outline">Explore features</Button></a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card · GST-ready · White-label friendly</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">Everything a transport office needs</h2>
          <p className="mt-3 text-muted-foreground">Replace 6 Excel sheets and a WhatsApp group with one structured workspace.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: "Inquiry → Order → Bilty", body: "Capture loads, negotiate rates with your team, dispatch trucks and auto-generate LR — all in one flow." },
            { icon: Receipt, title: "GST Invoicing", body: "Tax-compliant invoices with HSN codes, IGST/CGST split, and PDF download ready for the GST portal." },
            { icon: Wallet, title: "Payments & Ledger", body: "Track receivables from clients and payables to transporters. Bank-wise balances, party ledgers, daily cash flow." },
            { icon: Users, title: "Expenses & Salaries", body: "Daily expenses by category, employee records, salary payouts and per-month expense reports." },
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

      {/* Benefits */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-4 gap-6 text-center">
          {[
            { k: "70%", v: "Less time on paperwork" },
            { k: "100%", v: "GST-compliant invoices" },
            { k: "₹0", v: "Setup cost on Free plan" },
            { k: "24/7", v: "Cloud access, any device" },
          ].map(b => (
            <div key={b.v} className="rounded-2xl border bg-card p-8">
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-[var(--gradient-brand)]">{b.k}</div>
              <div className="mt-2 text-sm text-muted-foreground">{b.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">How TransFlow works</h2>
          <p className="mt-3 text-muted-foreground">From load enquiry to payment — four simple stages.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Search, t: "1. Capture inquiry", d: "Log client enquiries with route, material, weight and expected rate." },
            { icon: Truck, t: "2. Dispatch order", d: "Assign vehicle, transporter, driver and generate the bilty (LR) instantly." },
            { icon: FileText, t: "3. Raise GST invoice", d: "One-click tax invoice from the order — CGST/SGST or IGST handled automatically." },
            { icon: Banknote, t: "4. Track payments", d: "Record receipts and transporter payouts. See outstanding by party." },
          ].map(s => (
            <div key={s.t} className="rounded-2xl border bg-card p-6">
              <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4"><s.icon className="size-6" /></div>
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold">Loved by transport offices</h2>
            <p className="mt-3 text-muted-foreground">From single-truck owners to 200-vehicle agencies.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Rahul S.", c: "Bharti Roadlines, Indore", q: "Bilty and invoice in 30 seconds. Our accountant finally smiles at month-end." },
              { n: "Priya K.", c: "Shree Cargo, Surat", q: "Party ledger and outstanding view alone is worth the subscription. Replaced 3 Excel files." },
              { n: "Amit T.", c: "Highway Transport, Delhi", q: "Multi-user with roles means my dispatch team never touches finance data. Perfect." },
            ].map(t => (
              <div key={t.n} className="rounded-2xl border bg-card p-6">
                <div className="flex gap-0.5 text-amber-500 mb-3">{[...Array(5)].map((_,i)=><Star key={i} className="size-4 fill-current" />)}</div>
                <p className="text-sm leading-relaxed">"{t.q}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{t.n[0]}</div>
                  <div><div className="text-sm font-medium">{t.n}</div><div className="text-xs text-muted-foreground">{t.c}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
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

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold">Frequently asked</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Is TransFlow GST compliant?", a: "Yes. Invoices auto-split CGST/SGST for intrastate moves and IGST for interstate, with HSN code 996511 (goods transport). PDFs are portal-ready." },
              { q: "Can my whole team use one workspace?", a: "Yes — invite agents, dispatch staff and finance users with role-based access. Free plan supports 2 users, Pro supports 10, Enterprise is unlimited." },
              { q: "Is my data isolated from other companies?", a: "Absolutely. Every table uses workspace-scoped row-level security. Your data is never visible to any other tenant." },
              { q: "Can I white-label the bilty and invoice?", a: "Pro and Enterprise plans let you upload your company logo, stamp and signature — they appear automatically on bilty (LR) and tax invoices." },
              { q: "Do you support transporter payments?", a: "Yes — record advance, partial and final payments to transporters. Per-order and per-party outstanding views update in real time." },
              { q: "How do expenses and salaries work?", a: "The Expenses module supports daily entries by category (Fuel, Toll, Maintenance, Office, Misc), plus employee records and salary payouts with monthly reports." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="rounded-xl border bg-card px-4">
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <ContactSection />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-3xl bg-[var(--gradient-brand)] text-primary-foreground p-12 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold">Built for the Indian road.</h2>
          <p className="mt-4 max-w-2xl mx-auto opacity-90">From a single broker handling 5 trucks to an agency managing 200, TransFlow scales with you.</p>
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

function ContactSection() {
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!f.name || !f.message) return toast.error("Name and message required");
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: f.name, email: f.email || null, phone: f.phone || null, company: f.company || null, message: f.message,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks — we'll get back to you within 1 business day.");
    setF({ name: "", email: "", phone: "", company: "", message: "" });
  };
  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-24 border-t border-border">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold">Talk to us</h2>
          <p className="mt-3 text-muted-foreground">Questions about plans, migrations or custom features? Drop a message.</p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3"><span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Mail className="size-4" /></span> hello@transflow.in</div>
            <div className="flex items-center gap-3"><span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Phone className="size-4" /></span> +91 90000 00000</div>
            <div className="flex items-center gap-3"><span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><MapPin className="size-4" /></span> Indore, Madhya Pradesh, India</div>
            <div className="flex items-center gap-3"><span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Building2 className="size-4" /></span> Transport Bharti Pvt. Ltd.</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">Name *</label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></div>
            <div><label className="text-xs font-medium">Company</label><Input value={f.company} onChange={e=>setF({...f,company:e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">Email</label><Input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} /></div>
            <div><label className="text-xs font-medium">Phone</label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} /></div>
          </div>
          <div><label className="text-xs font-medium">Message *</label><Textarea rows={5} value={f.message} onChange={e=>setF({...f,message:e.target.value})} /></div>
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Sending…" : "Send message"}</Button>
        </div>
      </div>
    </section>
  );
}
