import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock } from "lucide-react";
import type { Lead, Rep } from "@/lib/leads-data";
import { formatCzk, formatDate, isDue, repInitials, repName } from "@/lib/leads-data";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<string, string> = { cold: "Cold", warm: "Warm", referral: "Referral" };
const SOURCE_TONE: Record<string, string> = {
  cold: "bg-secondary text-muted-foreground",
  warm: "bg-gold-soft text-accent-foreground",
  referral: "bg-won-soft text-won",
};

export function KanbanCard({
  lead,
  reps,
  onClick,
  dragging = false,
}: {
  lead: Lead;
  reps: Rep[];
  onClick?: () => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
  });

  const owner = repName(reps, lead.owner_rep_id);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab touch-none rounded-xl border border-border bg-background p-3 text-left shadow-sm transition-shadow hover:shadow-card active:cursor-grabbing",
        (isDragging || dragging) && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{lead.name}</p>
        {owner !== "—" && (
          <span className="label-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-ink-foreground">
            {repInitials(owner)}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn("label-mono rounded-full px-2 py-0.5", SOURCE_TONE[lead.source])}>
          {SOURCE_LABEL[lead.source]}
        </span>
        {lead.value_czk != null && (
          <span className="label-mono text-muted-foreground">{formatCzk(lead.value_czk)}</span>
        )}
      </div>
      {lead.next_follow_up && (
        <div
          className={cn(
            "label-mono mt-2 flex items-center gap-1",
            isDue(lead.next_follow_up) ? "text-lost" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="h-3 w-3" /> {formatDate(lead.next_follow_up)}
        </div>
      )}
    </div>
  );
}
