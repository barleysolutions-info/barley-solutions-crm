import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StagePlaybook } from "@/components/roadmap/stage-playbook";
import { Button } from "@/components/ui/button";
import { leadsQuery, repsQuery, formatCzk, formatDate, isDue, repName } from "@/lib/leads-data";
import { getStage, stageLabel } from "@/lib/pipeline";
import { moveLeadStage } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap/$stage")({
  head: ({ params }) => {
    const title = `${stageLabel(params.stage)} | Barley Sales Hub`;
    const description = `Postup a leady ve fázi ${stageLabel(params.stage)} sales procesu Barley Solutions.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: StagePage,
});

function StagePage() {
  return (
    <AppShell>
      <StageContent />
    </AppShell>
  );
}

function StageContent() {
  const { stage: stageKey } = useParams({ from: "/roadmap/$stage" });
  const stage = getStage(stageKey);
  const qc = useQueryClient();
  const { data: leads = [] } = useQuery(leadsQuery());
  const { data: reps = [] } = useQuery(repsQuery());
  const move = useServerFn(moveLeadStage);

  if (!stage) {
    return <p className="text-sm text-muted-foreground">Tahle fáze neexistuje.</p>;
  }

  const inStage = leads.filter((l) => l.stage === stage.key);
  const canAdvanceHere = stage.nextStageKey != null;

  const advance = async (leadId: string) => {
    if (!stage.nextStageKey) return;
    try {
      await move({ data: { leadId, toStage: stage.nextStageKey } });
      await qc.invalidateQueries();
      toast.success(`Lead posunut na ${stageLabel(stage.nextStageKey)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fázi se nepodařilo změnit.");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/roadmap"
        className="label-mono inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Zpět na strom procesu
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <StagePlaybook stage={stage} count={inStage.length} />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-5">
            <h2 className="label-mono text-muted-foreground">Leady v této fázi</h2>
          </div>
          {inStage.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">V téhle fázi teď nikdo není.</p>
          ) : (
            <ul className="divide-y divide-border">
              {inStage.map((l) => (
                <li key={l.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{l.name}</span>
                    <span className="label-mono rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                      {l.source}
                    </span>
                    <span className="label-mono text-muted-foreground">
                      {repName(reps, l.owner_rep_id)}
                    </span>
                    <span className="label-mono text-muted-foreground">
                      {formatCzk(l.value_czk)}
                    </span>
                    <span
                      className={cn(
                        "label-mono ml-auto",
                        isDue(l.next_follow_up) ? "text-lost" : "text-muted-foreground",
                      )}
                    >
                      follow-up {formatDate(l.next_follow_up)}
                    </span>
                  </div>
                  {canAdvanceHere && (
                    <Button size="sm" variant="ink" onClick={() => advance(l.id)}>
                      Posunout na {stageLabel(stage.nextStageKey!)} <ArrowRight />
                    </Button>
                  )}
                  {!canAdvanceHere && stage.key !== "won" && stage.key !== "lost" && (
                    <p className="label-mono text-muted-foreground">
                      Rozhodnutí (Closed / Lost) dělej v Lead DB — vyžaduje vybrat, kdo lead
                      uzavřel.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
