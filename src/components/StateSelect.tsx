import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IN_STATES } from "@/lib/states";

export function StateSelect({ value, onChange, placeholder = "Select state" }: { value: string | null; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-72">
        {IN_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
