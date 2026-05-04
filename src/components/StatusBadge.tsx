import { Badge } from "@/components/ui/badge";

const MAP: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  quoted: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  negotiating: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  won: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  lost: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  created: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  loaded: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  in_transit: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  receivable: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  payable: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`capitalize border ${MAP[value] ?? "bg-muted text-muted-foreground"}`}>
      {value.replace("_", " ")}
    </Badge>
  );
}
