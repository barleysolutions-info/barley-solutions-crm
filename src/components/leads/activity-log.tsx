import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { activitiesQuery } from "@/lib/leads-data";
import { useAuth } from "@/lib/auth";

const KINDS = [
  { value: "note", label: "Poznámka" },
  { value: "call", label: "Hovor" },
  { value: "email", label: "E-mail" },
  { value: "meeting", label: "Schůzka" },
];

export function ActivityLog({ leadId }: { leadId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: activities = [] } = useQuery(activitiesQuery(leadId));
  const [note, setNote] = useState("");
  const [kind, setKind] = useState("note");

  const addActivity = async () => {
    if (!note.trim() || !user) return;
    const { error } = await supabase.from("activities").insert({
      lead_id: leadId,
      user_id: user.id,
      kind: kind as "note",
      content: note.trim(),
    });
    if (error) toast.error("Záznam se nepodařilo uložit.");
    else {
      setNote("");
      qc.invalidateQueries({ queryKey: ["activities", leadId] });
    }
  };

  return (
    <div>
      <h3 className="label-mono text-muted-foreground">Historie jednání</h3>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          rows={2}
          placeholder="Co se stalo?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button variant="ink" type="button" onClick={addActivity}>
          Přidat
        </Button>
      </div>

      <ul className="mt-4 space-y-3">
        {activities.length === 0 && (
          <li className="text-sm text-muted-foreground">Zatím žádné záznamy.</li>
        )}
        {activities.map((a) => (
          <li key={a.id} className="border-l-2 border-border pl-3">
            <p className="label-mono text-muted-foreground">
              {KINDS.find((k) => k.value === a.kind)?.label ?? "Změna fáze"} ·{" "}
              {new Date(a.created_at).toLocaleString("cs-CZ", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{a.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
