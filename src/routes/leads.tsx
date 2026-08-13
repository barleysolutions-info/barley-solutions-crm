import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutGrid, List, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadList } from "@/components/leads/lead-list";
import { LeadSheet } from "@/components/leads/lead-sheet";
import { RepsManagerDialog } from "@/components/leads/reps-manager-dialog";
import { StageTransitionDialog } from "@/components/leads/stage-transition-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leadsQuery, repsQuery, type Lead } from "@/lib/leads-data";
import { LEAD_SOURCES, type StageKey } from "@/lib/pipeline";
import { moveLeadStage } from "@/lib/leads.functions";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Lead DB | Barley Sales Hub" },
      {
        name: "description",
        content: "Kanban a seznam všech leadů Barley Solutions na jednom místě.",
      },
      { property: "og:title", content: "Lead DB | Barley Sales Hub" },
      {
        property: "og:description",
        content: "Kanban a seznam všech leadů Barley Solutions na jednom místě.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  return (
    <AppShell>
      <LeadsContent />
    </AppShell>
  );
}

function LeadsContent() {
  const qc = useQueryClient();
  const move = useServerFn(moveLeadStage);
  const { data: leads = [], isLoading } = useQuery(leadsQuery());
  const { data: reps = [] } = useQuery(repsQuery());

  const [view, setView] = useState<"board" | "list">("board");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [pendingTransition, setPendingTransition] = useState<{
    lead: Lead;
    toStage: StageKey;
  } | null>(null);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchRep = repFilter === "all" || l.owner_rep_id === repFilter;
      return matchSource && matchRep;
    });
  }, [leads, sourceFilter, repFilter]);

  const openLead = (lead: Lead) => {
    setEditingLead(lead);
    setSheetOpen(true);
  };

  const openNewLead = () => {
    setEditingLead(undefined);
    setSheetOpen(true);
  };

  const commitMove = async (
    lead: Lead,
    toStage: StageKey,
    extra?: { closedByRepId?: string; lostReason?: string },
  ) => {
    const previous = leads;
    qc.setQueryData<Lead[]>(["leads"], (prev) =>
      (prev ?? []).map((l) => (l.id === lead.id ? { ...l, stage: toStage } : l)),
    );
    try {
      await move({
        data: {
          leadId: lead.id,
          toStage,
          closedByRepId: extra?.closedByRepId,
          lostReason: extra?.lostReason,
        },
      });
      await qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${lead.name} → nová fáze uložena.`);
    } catch (error) {
      qc.setQueryData<Lead[]>(["leads"], previous);
      const message = error instanceof Error ? error.message : "Fázi se nepodařilo změnit.";
      toast.error(message);
      if (message.includes("hodnotu jednoho zákazníka")) {
        openLead(lead);
      }
    }
  };

  // Shared gating path for both drag-and-drop (board) and the stage Select
  // (list view), so neither can bypass the won/lost required-field rules.
  const requestMove = (lead: Lead, toStage: StageKey) => {
    if (lead.stage === toStage) return;
    if (toStage === "won" || toStage === "lost") {
      setPendingTransition({ lead, toStage });
      return;
    }
    void commitMove(lead, toStage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground">Lead DB</p>
          <h1 className="mt-1 text-3xl font-bold">Všichni leadi na jednom místě</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <RepsManagerDialog reps={reps} />
          <Button variant="ink" onClick={openNewLead}>
            <Plus /> Nový lead
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
          <TabsList>
            <TabsTrigger value="board" className="gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" /> Seznam
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny zdroje</SelectItem>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={repFilter} onValueChange={setRepFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všichni obchodníci</SelectItem>
            {reps.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Načítám leady…</p>
      ) : view === "board" ? (
        <KanbanBoard
          leads={filtered}
          reps={reps}
          onOpenLead={openLead}
          onRequestMove={requestMove}
        />
      ) : (
        <LeadList leads={filtered} reps={reps} onOpenLead={openLead} onRequestMove={requestMove} />
      )}

      <LeadSheet open={sheetOpen} onOpenChange={setSheetOpen} lead={editingLead} reps={reps} />

      <StageTransitionDialog
        open={pendingTransition != null}
        toStage={pendingTransition?.toStage ?? "won"}
        reps={reps}
        onOpenChange={(open) => !open && setPendingTransition(null)}
        onConfirm={(extra) => {
          if (!pendingTransition) return;
          void commitMove(pendingTransition.lead, pendingTransition.toStage, extra);
          setPendingTransition(null);
        }}
      />
    </div>
  );
}
