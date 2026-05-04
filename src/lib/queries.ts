import { supabase } from "@/integrations/supabase/client";

export async function nextDocNo(companyId: string, kind: "INQ" | "ORD" | "BLT") {
  const { data, error } = await supabase.rpc("next_doc_no", {
    _company_id: companyId,
    _kind: kind,
    _prefix: kind,
  });
  if (error) throw error;
  return data as string;
}

export const fmtINR = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
