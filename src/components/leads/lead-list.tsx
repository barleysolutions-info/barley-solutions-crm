import { ACTIVE_STAGES, getStage } from "@/lib/pipeline";
import type { StageKey } from "@/lib/pipeline";
import type { Lead, Rep } from "@/lib/leads-data";
import { formatCzk, formatDate, isDue, repName } from "@/lib/leads-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LIST_STAGES: StageKey[] = [...ACTIVE_STAGES, "won", "lost"];

export function LeadList({
  leads,
  reps,
  onOpenLead,
  onRequestMove,
}: {
  leads: Lead[];
  reps: Rep[];
  onOpenLead: (lead: Lead) => void;
  onRequestMove: (lead: Lead, toStage: StageKey) => void;
}) {
  return (
    <div className="space-y-4">
      {LIST_STAGES.map((key) => {
        const stage = getStage(key)!;
        const inStage = leads.filter((l) => l.stage === key);
        return (
          <section key={key} className="rounded-2xl border border-border bg-card shadow-card">
            <header className="flex items-center gap-2 border-b border-border p-3">
              <span className="label-mono text-muted-foreground">{stage.num}</span>
              <h3 className="text-sm font-semibold">{stage.title}</h3>
              <span className="label-mono rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                {inStage.length}
              </span>
            </header>
            {inStage.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">Prázdné</p>
            ) : (
              <ul className="divide-y divide-border">
                {inStage.map((lead) => (
                  <li key={lead.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenLead(lead)}
                      className="min-w-40 flex-1 text-left text-sm font-medium hover:underline"
                    >
                      {lead.name}
                    </button>
                    <span className="label-mono hidden text-muted-foreground sm:inline">
                      {repName(reps, lead.owner_rep_id)}
                    </span>
                    <span className="label-mono hidden text-muted-foreground sm:inline">
                      {formatCzk(lead.value_czk)}
                    </span>
                    <span
                      className={cn(
                        "label-mono hidden sm:inline",
                        isDue(lead.next_follow_up) ? "text-lost" : "text-muted-foreground",
                      )}
                    >
                      {formatDate(lead.next_follow_up)}
                    </span>
                    <Select
                      value={lead.stage}
                      onValueChange={(v) => onRequestMove(lead, v as StageKey)}
                    >
                      <SelectTrigger className="h-8 w-40 border-none bg-transparent shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIST_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {getStage(s)!.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
