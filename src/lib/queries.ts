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

export async function exportXLSX(filename: string, sheets: { name: string; rows: Record<string, unknown>[] }[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function exportPDF(filename: string, title: string, columns: string[], rows: (string | number)[][]) {
  const { default: jsPDF } = await import("jspdf");
  const auto = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14); doc.text(title, 14, 16);
  doc.setFontSize(9); doc.text(new Date().toLocaleString("en-IN"), 14, 22);
  auto(doc, { startY: 28, head: [columns], body: rows, styles: { fontSize: 9 }, headStyles: { fillColor: [99, 102, 241] } });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}


export async function downloadElementAsPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Element not found: " + elementId);
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210, pageH = 297, margin = 8;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let position = margin;
  pdf.addImage(img, "PNG", margin, position, imgW, imgH);
  heightLeft -= pageH - margin * 2;
  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgH - heightLeft);
    pdf.addImage(img, "PNG", margin, position, imgW, imgH);
    heightLeft -= pageH - margin * 2;
  }
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
