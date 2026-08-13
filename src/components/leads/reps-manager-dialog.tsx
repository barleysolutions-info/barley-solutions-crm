import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Rep } from "@/lib/leads-data";

// No dedicated "manage reps" surface existed in the original plan, but
// without one the owner/sourced-by/closed-by pickers would have nothing to
// select from and no way to add a salesperson short of the SQL editor.
export function RepsManagerDialog({ reps }: { reps: Rep[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const qc = useQueryClient();

  const addRep = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Zadej jméno obchodníka.");
      const { error } = await supabase.from("reps").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["reps"] });
      toast.success("Obchodník přidán.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("reps").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reps"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="quiet">
          <Users /> Obchodníci
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Obchodníci</DialogTitle>
          <DialogDescription>
            Číselník lidí, které jde přiřadit jako vlastníka, zdroj nebo uzavíratele leadu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Jméno a příjmení"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRep.mutate()}
          />
          <Button variant="ink" onClick={() => addRep.mutate()} disabled={addRep.isPending}>
            {addRep.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Přidat
          </Button>
        </div>

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {reps.length === 0 && (
            <p className="text-sm text-muted-foreground">Zatím žádní obchodníci.</p>
          )}
          {reps.map((rep) => (
            <li
              key={rep.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary"
            >
              <span className={rep.active ? "" : "text-muted-foreground line-through"}>
                {rep.name}
              </span>
              <Switch
                checked={rep.active}
                onCheckedChange={(active) => toggleActive.mutate({ id: rep.id, active })}
              />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
