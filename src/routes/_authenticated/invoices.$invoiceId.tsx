import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { fmtINR, fmtDate, amountInWords } from "@/lib/queries";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices/$invoiceId")({ component: InvoicePage });

interface Inv {
  id: string; invoice_no: string; invoice_date: string; due_date: string | null;
  consignor_state: string | null; consignee_state: string | null;
  subtotal: number; cgst_amount: number; sgst_amount: number; igst_amount: number; total_amount: number; notes: string | null;
  parties: { name: string; address: string | null; gst: string | null; phone: string | null; email: string | null } | null;
  party_gst_registrations: { gstin: string; legal_name: string | null; state: string; address: string | null } | null;
  orders: { order_no: string; from_city: string | null; to_city: string | null; vehicles: { number: string } | null } | null;
}
interface Item { id: string; description: string; hsn_code: string | null; qty: number; unit: string | null; rate: number; amount: number; gst_rate: number }

function InvoicePage() {
  const { invoiceId } = Route.useParams();
  const { company } = useAuth();
  const [inv, setInv] = useState<Inv | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const { data: i } = await supabase.from("invoices")
        .select("id,invoice_no,invoice_date,due_date,consignor_state,consignee_state,subtotal,cgst_amount,sgst_amount,igst_amount,total_amount,notes,parties(name,address,gst,phone,email),party_gst_registrations(gstin,legal_name,state,address),orders(order_no,from_city,to_city,vehicles(number))")
        .eq("id", invoiceId).maybeSingle();
      setInv(i as never as Inv);
      const { data: it } = await supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId);
      setItems((it ?? []) as Item[]);
    })();
  }, [invoiceId]);

  if (!inv) return <div className="p-8">Loading…</div>;
  const brand = company?.brand_primary || "#1d4ed8";
  const interstate = !!inv.igst_amount && inv.igst_amount > 0;

  return (
    <div className="min-h-screen bg-white text-black p-6 print:p-0">
      <div className="max-w-4xl mx-auto bg-white">
        <div className="flex justify-end mb-3 print:hidden gap-2">
          <Button onClick={() => window.print()}><Printer className="size-4 mr-1" /> Print / Save PDF</Button>
        </div>
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: brand }}>
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between gap-6" style={{ background: brand, color: "white" }}>
            <div className="flex items-center gap-3">
              {company?.logo_url && <img src={company.logo_url} alt="" className="h-14 bg-white p-1 rounded" />}
              <div>
                <div className="font-bold text-2xl">{company?.name}</div>
                <div className="text-xs opacity-90 whitespace-pre-line">{(company as never as { address?: string })?.address ?? ""}</div>
                <div className="text-xs opacity-90">{(company as never as { phone?: string })?.phone ?? ""} {(company as never as { email?: string })?.email ?? ""}</div>
                {company?.gst_number && <div className="text-xs opacity-90">GSTIN: {company.gst_number}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm uppercase tracking-wider opacity-80">Tax Invoice</div>
              <div className="font-mono font-bold text-lg">{inv.invoice_no}</div>
              <div className="text-xs opacity-80 mt-1">Date: {fmtDate(inv.invoice_date)}</div>
              {inv.orders?.order_no && <div className="text-xs opacity-80">Order: {inv.orders.order_no}</div>}
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 border-b">
            <div className="p-4 border-r">
              <div className="text-xs uppercase text-gray-500 font-semibold">Bill To</div>
              <div className="font-bold mt-1">{inv.party_gst_registrations?.legal_name || inv.parties?.name}</div>
              <div className="text-xs text-gray-700 whitespace-pre-line">{inv.party_gst_registrations?.address || inv.parties?.address}</div>
              {inv.party_gst_registrations?.gstin && <div className="text-xs mt-1">GSTIN: <span className="font-mono">{inv.party_gst_registrations.gstin}</span></div>}
              {inv.party_gst_registrations?.state && <div className="text-xs">State: {inv.party_gst_registrations.state}</div>}
              {inv.parties?.phone && <div className="text-xs">Phone: {inv.parties.phone}</div>}
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-gray-500 uppercase">Place of Supply</div><div className="font-medium">{inv.consignee_state ?? "—"}</div></div>
              <div><div className="text-gray-500 uppercase">From → To</div><div>{inv.orders?.from_city ?? "—"} → {inv.orders?.to_city ?? "—"}</div></div>
              <div><div className="text-gray-500 uppercase">Vehicle</div><div>{inv.orders?.vehicles?.number ?? "—"}</div></div>
              <div><div className="text-gray-500 uppercase">Due Date</div><div>{inv.due_date ? fmtDate(inv.due_date) : "On receipt"}</div></div>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-sm">
            <thead style={{ background: brand + "15" }}>
              <tr className="text-left">
                <th className="p-2 w-10">#</th>
                <th className="p-2">Description</th>
                <th className="p-2">HSN</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Rate</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{it.description}</td>
                  <td className="p-2 font-mono text-xs">{it.hsn_code ?? "996791"}</td>
                  <td className="p-2 text-right">{it.qty} {it.unit ?? ""}</td>
                  <td className="p-2 text-right">{fmtINR(it.rate)}</td>
                  <td className="p-2 text-right">{fmtINR(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="grid grid-cols-2 border-t">
            <div className="p-4 text-xs space-y-2">
              <div>
                <div className="text-gray-500 uppercase font-semibold">Amount in words</div>
                <div className="italic">{amountInWords(inv.total_amount)}</div>
              </div>
              {((company as never as { bank_name?: string })?.bank_name) && (
                <div className="mt-3">
                  <div className="text-gray-500 uppercase font-semibold">Bank Details</div>
                  <div>{(company as never as { bank_name?: string })?.bank_name} {(company as never as { bank_branch?: string })?.bank_branch ? `· ${(company as never as { bank_branch?: string })?.bank_branch}` : ""}</div>
                  <div>A/c: <span className="font-mono">{(company as never as { bank_account_no?: string })?.bank_account_no}</span></div>
                  <div>IFSC: <span className="font-mono">{(company as never as { bank_ifsc?: string })?.bank_ifsc}</span></div>
                </div>
              )}
            </div>
            <div className="p-4 text-sm border-l">
              <table className="w-full">
                <tbody>
                  <tr><td>Subtotal</td><td className="text-right">{fmtINR(inv.subtotal)}</td></tr>
                  {interstate ? (
                    <tr><td>IGST</td><td className="text-right">{fmtINR(inv.igst_amount)}</td></tr>
                  ) : (
                    <>
                      <tr><td>CGST</td><td className="text-right">{fmtINR(inv.cgst_amount)}</td></tr>
                      <tr><td>SGST</td><td className="text-right">{fmtINR(inv.sgst_amount)}</td></tr>
                    </>
                  )}
                  <tr className="border-t font-bold text-lg" style={{ color: brand }}>
                    <td className="pt-2">Total</td><td className="text-right pt-2">{fmtINR(inv.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          {((company as never as { invoice_terms?: string })?.invoice_terms || (company as never as { invoice_footer?: string })?.invoice_footer) && (
            <div className="border-t p-4 text-xs text-gray-700 space-y-2">
              {(company as never as { invoice_terms?: string })?.invoice_terms && (
                <div>
                  <div className="font-semibold uppercase text-gray-500">Terms & Conditions</div>
                  <div className="whitespace-pre-line">{(company as never as { invoice_terms?: string })?.invoice_terms}</div>
                </div>
              )}
              {(company as never as { invoice_footer?: string })?.invoice_footer && <div className="text-center italic">{(company as never as { invoice_footer?: string })?.invoice_footer}</div>}
            </div>
          )}

          <div className="grid grid-cols-2 border-t text-xs">
            <div className="p-4 border-r h-24 text-gray-600">Receiver signature</div>
            <div className="p-4 h-24 text-right">
              <div>For {company?.name}</div>
              {(company as never as { signature_url?: string })?.signature_url && <img src={(company as never as { signature_url?: string })?.signature_url} className="h-12 ml-auto mt-1" alt="" />}
              <div className="mt-2 text-gray-500">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
