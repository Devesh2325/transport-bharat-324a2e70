import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export interface ProductLite { id: string; name: string; hsn_code: string | null; unit: string | null; default_rate: number | null; gst_rate: number | null }

export function ProductCombobox({ value, onChange, onPick }: { value: string | null; onChange: (id: string) => void; onPick?: (p: ProductLite) => void }) {
  const { company } = useAuth();
  const [items, setItems] = useState<ProductLite[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [hsn, setHsn] = useState(""); const [unit, setUnit] = useState("MT");
  const [rate, setRate] = useState(""); const [gst, setGst] = useState("5");

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("products").select("id,name,hsn_code,unit,default_rate,gst_rate").eq("company_id", company.id).order("name");
    setItems((data ?? []) as ProductLite[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const create = async () => {
    if (!company || !name.trim()) return;
    const { data, error } = await supabase.from("products").insert({
      company_id: company.id, name: name.trim(), hsn_code: hsn || null, unit, default_rate: Number(rate || 0), gst_rate: Number(gst || 5),
    }).select("id,name,hsn_code,unit,default_rate,gst_rate").single();
    if (error) return toast.error(error.message);
    setItems([...items, data as ProductLite]);
    onChange(data.id); onPick?.(data as ProductLite);
    setOpen(false); setName(""); setHsn(""); setRate("");
    toast.success("Product added");
  };

  const handleChange = (id: string) => { onChange(id); const p = items.find(x => x.id === id); if (p) onPick?.(p); };

  return (
    <div className="flex gap-2">
      <Select value={value ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
        <SelectContent>
          {items.map(p => <SelectItem key={p.id} value={p.id}>{p.name} <span className="text-muted-foreground text-xs">· {p.unit ?? ""}</span></SelectItem>)}
          {items.length === 0 && <div className="p-2 text-xs text-muted-foreground">No products yet</div>}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Plus className="size-4" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>HSN</Label><Input value={hsn} onChange={e => setHsn(e.target.value)} /></div>
              <div><Label>Unit</Label><Input value={unit} onChange={e => setUnit(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Default Rate (₹)</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} /></div>
              <div><Label>GST %</Label><Input type="number" value={gst} onChange={e => setGst(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={create}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
