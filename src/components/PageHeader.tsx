import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="px-8 pt-8 pb-6 border-b border-border bg-card/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="px-8 py-16">
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">Coming soon</div>
        <h2 className="mt-2 text-2xl font-display font-bold">{feature}</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          The foundation is ready — workspace isolation, roles and quotas are live. This module ships next. Tell us which feature to build first.
        </p>
      </div>
    </div>
  );
}
