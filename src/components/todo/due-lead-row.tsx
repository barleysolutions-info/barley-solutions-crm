import { StageChip } from "@/components/stage-chip";
import { formatDate } from "@/lib/leads-data";
import type { Lead } from "@/lib/leads-data";

export function DueLeadRow({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <button type="button" onClick={onClick} className="font-medium hover:underline">
        {lead.name}
      </button>
      <StageChip stage={lead.stage} asLink />
      <span className="text-sm text-muted-foreground">{lead.follow_up_note || "bez poznámky"}</span>
      <span className="label-mono ml-auto text-lost">{formatDate(lead.next_follow_up)}</span>
    </li>
  );
}
