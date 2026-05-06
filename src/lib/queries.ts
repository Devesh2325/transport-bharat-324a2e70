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

const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
function below1000(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
  return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + below1000(n%100) : "");
}
export function amountInWords(num: number): string {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return "Zero Rupees Only";
  const cr = Math.floor(n/10000000);
  const lk = Math.floor((n%10000000)/100000);
  const th = Math.floor((n%100000)/1000);
  const rest = n%1000;
  let s = "";
  if (cr) s += below1000(cr) + " Crore ";
  if (lk) s += below1000(lk) + " Lakh ";
  if (th) s += below1000(th) + " Thousand ";
  if (rest) s += below1000(rest);
  return s.trim() + " Rupees Only";
}
