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

export interface PartyLite { id: string; name: string; type: string; phone?: string | null }

export function PartyCombobox({ value, onChange, type }: { value: string | null; onChange: (id: string) => void; type?: string }) {
  const { company } = useAuth();
  const [parties, setParties] = useState<PartyLite[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pType, setPType] = useState(type || "client");

  const load = async () => {
    if (!company) return;
    const q = supabase.from("parties").select("id,name,type,phone").eq("company_id", company.id).order("name");
    const { data } = await q;
    setParties((data ?? []) as PartyLite[]);
  };
  useEffect(() => { load(); }, [company?.id]);

  const create = async () => {
    if (!company || !name.trim()) return;
    const { data, error } = await supabase.from("parties").insert({ company_id: company.id, name: name.trim(), type: pType as never, phone }).select("id,name,type,phone").single();
    if (error) return toast.error(error.message);
    setParties([...parties, data as PartyLite]);
    onChange(data.id);
    setOpen(false); setName(""); setPhone("");
    toast.success("Party added");
  };

  return (
    <div className="flex gap-2">
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="flex-1"><SelectValue placeholder="Select party" /></SelectTrigger>
        <SelectContent>
          {parties.filter(p => !type || p.type === type).map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name} <span className="text-muted-foreground text-xs">· {p.type}</span></SelectItem>
          ))}
          {parties.length === 0 && <div className="p-2 text-xs text-muted-foreground">No parties yet</div>}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Plus className="size-4" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>New Party</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Type</Label>
              <Select value={pType} onValueChange={setPType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="consignor">Consignor</SelectItem>
                  <SelectItem value="consignee">Consignee</SelectItem>
                  <SelectItem value="transporter">Transporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={create}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
