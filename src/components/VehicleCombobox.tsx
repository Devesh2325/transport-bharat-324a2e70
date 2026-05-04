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

interface V { id: string; number: string; type: string | null }

export function VehicleCombobox({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { company } = useAuth();
  const [list, setList] = useState<V[]>([]);
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState(""); const [type, setType] = useState("");

  const load = async () => {
    if (!company) return;
    const { data } = await supabase.from("vehicles").select("id,number,type").eq("company_id", company.id).order("number");
    setList((data ?? []) as V[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const create = async () => {
    if (!company || !number.trim()) return;
    const { data, error } = await supabase.from("vehicles").insert({ company_id: company.id, number: number.trim().toUpperCase(), type }).select("id,number,type").single();
    if (error) return toast.error(error.message);
    setList([...list, data as V]); onChange(data.id); setOpen(false); setNumber(""); setType("");
    toast.success("Vehicle added");
  };

  return (
    <div className="flex gap-2">
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
        <SelectContent>
          {list.map(v => <SelectItem key={v.id} value={v.id}>{v.number} {v.type && <span className="text-xs text-muted-foreground">· {v.type}</span>}</SelectItem>)}
          {list.length === 0 && <div className="p-2 text-xs text-muted-foreground">No vehicles yet</div>}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Plus className="size-4" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>New Vehicle</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Number</Label><Input value={number} onChange={e => setNumber(e.target.value)} placeholder="MH12AB1234" /></div>
            <div><Label>Type</Label><Input value={type} onChange={e => setType(e.target.value)} placeholder="22ft / Trailer / Container" /></div>
          </div>
          <DialogFooter><Button onClick={create}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
