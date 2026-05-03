import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/plans")({ component: PlansAdmin });

type Plan = { id: string; name: string; code: string; price_inr: number; user_limit: number; storage_mb: number; is_active: boolean };

function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => { supabase.from("plans").select("*").order("price_inr").then(({ data }) => setPlans(data ?? [])); }, []);
  return (
    <div className="px-8 py-8">
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.code}</div>
            <h3 className="mt-1 font-display text-2xl font-bold">{p.name}</h3>
            <div className="mt-3 text-3xl font-bold">₹{p.price_inr.toLocaleString("en-IN")}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="mt-4 text-sm space-y-1.5 text-muted-foreground">
              <li>{p.user_limit} users</li>
              <li>{(p.storage_mb / 1024).toFixed(1)} GB storage</li>
              <li>Status: <span className={p.is_active ? "text-success" : "text-destructive"}>{p.is_active ? "Active" : "Inactive"}</span></li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
