import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DueLeadRow } from "@/components/todo/due-lead-row";
import { LeadSheet } from "@/components/leads/lead-sheet";
import { Button } from "@/components/ui/button";
import { leadsQuery, repsQuery, formatCzk, isDue, type Lead } from "@/lib/leads-data";
import { STAGES } from "@/lib/pipeline";
import { analyzePipeline } from "@/lib/leads.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "TODO | Barley Sales Hub" },
      { name: "description", content: "Follow-upy na dnešek a stav pipeline na jednom místě." },
      { property: "og:title", content: "TODO | Barley Sales Hub" },
      {
        property: "og:description",
        content: "Follow-upy na dnešek a stav pipeline na jednom místě.",
      },
    ],
  }),
  component: TodoPage,
});

function TodoPage() {
  return (
    <AppShell>
      <TodoContent />
    </AppShell>
  );
}

function TodoContent() {
  const { data: leads = [], isLoading } = useQuery(leadsQuery());
  const { data: reps = [] } = useQuery(repsQuery());
  const analyze = useServerFn(analyzePipeline);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const due = open
    .filter((l) => isDue(l.next_follow_up))
    .sort((a, b) => (a.next_follow_up ?? "").localeCompare(b.next_follow_up ?? ""));
  const pipelineValue = open.reduce((sum, l) => sum + (l.value_czk ?? 0), 0);
  const wonValue = leads
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + (l.value_czk ?? 0), 0);

  const openLead = (lead: Lead) => {
    setEditingLead(lead);
    setSheetOpen(true);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await analyze({ data: undefined });
      setAnalysis(res.analysis);
    } catch {
      toast.error("Analýzu se nepodařilo vytvořit.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground">Přehled</p>
        <h1 className="mt-1 text-3xl font-bold">Co dnes posunout</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Otevřené leady" value={String(open.length)} />
        <Stat
          label="Follow-up dnes"
          value={String(due.length)}
          tone={due.length ? "alert" : "default"}
        />
        <Stat label="Hodnota pipeline" value={formatCzk(pipelineValue)} />
        <Stat label="Uzavřeno (Won)" value={formatCzk(wonValue)} tone="won" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" /> Follow-upy k vyřízení
            </h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Načítám…</p>
            ) : due.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Nic dnes nehoří. Přidej follow-up u leadů, které čekají na reakci.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {due.map((l) => (
                  <DueLeadRow key={l.id} lead={l} onClick={() => openLead(l)} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-ink p-5 text-ink-foreground shadow-node">
            <h2 className="label-mono flex items-center gap-2 text-gold">
              <Sparkles className="h-4 w-4" /> AI analýza pipeline
            </h2>
            <p className="mt-3 text-sm text-ink-foreground/70">
              Projde všechny leady a řekne, kde to vázne a co dělat dnes.
            </p>
            {analysis && (
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">{analysis}</p>
            )}
            <Button
              variant="gold"
              className="mt-4 w-full"
              onClick={runAnalysis}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="animate-spin" /> : <TrendingUp />}
              {analysis ? "Přepočítat" : "Analyzovat"}
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="label-mono text-muted-foreground">Rozložení pipeline</h2>
            <ul className="mt-4 space-y-2">
              {STAGES.map((s) => {
                const count = leads.filter((l) => l.stage === s.key).length;
                return (
                  <li key={s.key} className="flex items-center gap-3 text-sm">
                    <span className="label-mono w-8 text-muted-foreground">{s.num}</span>
                    <span className="flex-1">{s.title}</span>
                    <span
                      className={cn(
                        "label-mono rounded-full px-2 py-0.5",
                        count ? "bg-secondary text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      <LeadSheet open={sheetOpen} onOpenChange={setSheetOpen} lead={editingLead} reps={reps} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "alert" | "won";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold",
          tone === "alert" && "text-lost",
          tone === "won" && "text-won",
        )}
      >
        {value}
      </p>
    </div>
  );
}
