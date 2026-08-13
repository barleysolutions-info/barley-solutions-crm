import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ACTIVE_STAGES, getStage } from "@/lib/pipeline";
import type { StageKey } from "@/lib/pipeline";
import type { Lead, Rep } from "@/lib/leads-data";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

const BOARD_STAGES: StageKey[] = [...ACTIVE_STAGES, "won", "lost"];

export function KanbanBoard({
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
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStage = (key: StageKey) => leads.filter((l) => l.stage === key);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const lead = leads.find((l) => l.id === active.id);
    const toStage = over.id as StageKey;
    if (!lead || lead.stage === toStage) return;
    onRequestMove(lead, toStage);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Column height is driven by the container, not by content — every
          column is the same height regardless of card count, with its own
          independent scroll. This is the direct fix for uneven column
          bottoms ("urovnat sloupce"). */}
      <div className="flex h-[calc(100vh-19rem)] min-h-[26rem] gap-4 overflow-x-auto pb-4">
        {BOARD_STAGES.map((key) => {
          const stage = getStage(key)!;
          return (
            <KanbanColumn
              key={key}
              stage={stage}
              leads={byStage(key)}
              reps={reps}
              onOpenLead={onOpenLead}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeLead && <KanbanCard lead={activeLead} reps={reps} dragging />}
      </DragOverlay>
    </DndContext>
  );
}
