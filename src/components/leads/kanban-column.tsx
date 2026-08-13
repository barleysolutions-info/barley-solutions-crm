import { useDroppable } from "@dnd-kit/core";
import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { Stage } from "@/lib/pipeline";
import type { Lead, Rep } from "@/lib/leads-data";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";

export function KanbanColumn({
  stage,
  leads,
  reps,
  onOpenLead,
}: {
  stage: Stage;
  leads: Lead[];
  reps: Rep[];
  onOpenLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "grid h-full w-72 shrink-0 grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-colors",
        isOver && "border-gold bg-gold-soft/40",
      )}
    >
      <header className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span className="label-mono text-muted-foreground">{stage.num}</span>
          <h3 className="flex-1 truncate text-sm font-semibold">{stage.title}</h3>
          <span className="label-mono rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
            {leads.length}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{stage.columnBlurb}</p>
        <Link
          to="/roadmap/$stage"
          params={{ stage: stage.key }}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          <Info className="h-3 w-3" /> Detail fáze
        </Link>
      </header>
      <div className="min-h-0 space-y-2 overflow-y-auto p-2">
        {leads.length === 0 ? (
          <p className="p-3 text-center text-xs text-muted-foreground">Prázdné</p>
        ) : (
          leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} reps={reps} onClick={() => onOpenLead(lead)} />
          ))
        )}
      </div>
    </section>
  );
}
