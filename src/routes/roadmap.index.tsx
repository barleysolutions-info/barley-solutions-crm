import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { StagePlaybook } from "@/components/roadmap/stage-playbook";
import { RoadmapTree } from "@/components/roadmap/roadmap-tree";
import { leadsQuery } from "@/lib/leads-data";
import { getStage, type StageKey } from "@/lib/pipeline";

export const Route = createFileRoute("/roadmap/")({
  head: () => ({
    meta: [
      { title: "Roadmap sales procesu | Barley Sales Hub" },
      {
        name: "description",
        content: "Vizuální strom sales procesu Barley Solutions — od nového leadu po podpis.",
      },
      { property: "og:title", content: "Roadmap sales procesu | Barley Sales Hub" },
      {
        property: "og:description",
        content: "Vizuální strom sales procesu Barley Solutions — od nového leadu po podpis.",
      },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <AppShell>
      <RoadmapContent />
    </AppShell>
  );
}

function RoadmapContent() {
  const { data: leads = [] } = useQuery(leadsQuery());
  const [selected, setSelected] = useState<StageKey>("new_lead");

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] ?? 0) + 1;
    return acc;
  }, {});

  const stage = getStage(selected)!;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-mono text-muted-foreground">Roadmap</p>
        <h1 className="mt-1 text-3xl font-bold">Jeden postup pro každý lead</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Klikni na fázi ve stromu a napravo uvidíš, co přesně v ní udělat, kdy je hotová a co
          následuje.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RoadmapTree selected={selected} onSelect={setSelected} counts={counts} />
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-6">
          <StagePlaybook stage={stage} count={counts[stage.key] ?? 0} showLink />
        </aside>
      </div>
    </div>
  );
}
