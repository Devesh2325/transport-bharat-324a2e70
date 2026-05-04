import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { fmtINR, fmtDate } from "@/lib/queries";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders/$orderId/bilty")({ component: BiltyPage });

function BiltyPage() {
  const { orderId } = Route.useParams();
  const { company } = useAuth();
  const [data, setData] = useState<{
    order_no: string; bilty_no: string | null; from_city: string | null; to_city: string | null;
    material: string | null; weight_tons: number | null; freight_amount: number; advance_amount: number;
    driver_name: string | null; driver_phone: string | null; created_at: string;
    parties: { name: string; gst: string | null; address: string | null } | null;
    vehicles: { number: string } | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders")
        .select("order_no,bilty_no,from_city,to_city,material,weight_tons,freight_amount,advance_amount,driver_name,driver_phone,created_at,parties(name,gst,address),vehicles(number)")
        .eq("id", orderId).maybeSingle();
      setData(data as never);
    })();
  }, [orderId]);

  if (!data) return <div className="p-8">Loading…</div>;
  const balance = Number(data.freight_amount) - Number(data.advance_amount);
  const brand = company?.brand_primary || "#6366f1";

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0">
      <div className="max-w-3xl mx-auto bg-white">
        <div className="flex justify-end mb-3 print:hidden">
          <Button onClick={() => window.print()}><Printer className="size-4 mr-1" /> Print / Save PDF</Button>
        </div>
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: brand }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: brand, color: "white" }}>
            <div className="flex items-center gap-3">
              {company?.logo_url && <img src={company.logo_url} alt="" className="h-10" />}
              <div>
                <div className="font-bold text-xl">{company?.name}</div>
                <div className="text-xs opacity-80">Lorry Receipt (Bilty)</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-80">Bilty No.</div>
              <div className="font-mono font-bold">{data.bilty_no ?? "—"}</div>
              <div className="text-xs opacity-80 mt-1">{fmtDate(data.created_at)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-b">
            <div className="p-4 border-r">
              <div className="text-xs uppercase text-gray-500">Consignor / Client</div>
              <div className="font-semibold">{data.parties?.name ?? "—"}</div>
              <div className="text-xs text-gray-600 whitespace-pre-line">{data.parties?.address}</div>
              {data.parties?.gst && <div className="text-xs">GST: {data.parties.gst}</div>}
            </div>
            <div className="p-4">
              <div className="text-xs uppercase text-gray-500">Order</div>
              <div className="font-mono">{data.order_no}</div>
              <div className="text-xs text-gray-600 mt-2">From → To</div>
              <div>{data.from_city} → {data.to_city}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-0 border-b text-sm">
            <div className="p-4 border-r"><div className="text-xs text-gray-500">Vehicle</div><div className="font-semibold">{data.vehicles?.number ?? "—"}</div></div>
            <div className="p-4 border-r"><div className="text-xs text-gray-500">Driver</div><div>{data.driver_name ?? "—"}</div><div className="text-xs">{data.driver_phone}</div></div>
            <div className="p-4"><div className="text-xs text-gray-500">Material / Weight</div><div>{data.material ?? "—"}</div><div className="text-xs">{data.weight_tons ?? "—"} t</div></div>
          </div>

          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1.5">Freight</td><td className="text-right font-semibold">{fmtINR(data.freight_amount)}</td></tr>
                <tr><td className="py-1.5">Advance</td><td className="text-right">{fmtINR(data.advance_amount)}</td></tr>
                <tr className="border-t"><td className="py-2 font-bold">Balance Due</td><td className="text-right font-bold text-lg" style={{ color: brand }}>{fmtINR(balance)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-0 border-t text-xs text-gray-600">
            <div className="p-4 border-r h-24"><div className="mb-8">Consignor signature</div></div>
            <div className="p-4 h-24 text-right"><div className="mb-8">For {company?.name}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
