import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StageChip } from "@/components/stage-chip";
import { LeadSheet } from "@/components/leads/lead-sheet";
import { Button } from "@/components/ui/button";
import { leadsQuery, repsQuery, formatCzk, formatDate, isDue, type Lead } from "@/lib/leads-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Kalendář follow-upů | Barley Sales Hub" },
      {
        name: "description",
        content:
          "Měsíční kalendář všech naplánovaných follow-upů s leady — co kdy zavolat a komu se ozvat.",
      },
      { property: "og:title", content: "Kalendář follow-upů | Barley Sales Hub" },
      { property: "og:description", content: "Měsíční přehled naplánovaných follow-upů s leady." },
    ],
  }),
  component: CalendarPage,
});

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  return (
    <AppShell>
      <FollowUpCalendar />
    </AppShell>
  );
}

function FollowUpCalendar() {
  const { data: leads = [], isLoading } = useQuery(leadsQuery());
  const { data: reps = [] } = useQuery(repsQuery());
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toKey(today));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);

  const openLead = (lead: Lead) => {
    setEditingLead(lead);
    setSheetOpen(true);
  };

  const byDay = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) {
      if (!l.next_follow_up || l.stage === "won" || l.stage === "lost") continue;
      const list = map.get(l.next_follow_up) ?? [];
      list.push(l);
      map.set(l.next_follow_up, list);
    }
    return map;
  }, [leads]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const overdue = leads
    .filter(
      (l) =>
        l.next_follow_up &&
        l.stage !== "won" &&
        l.stage !== "lost" &&
        l.next_follow_up < toKey(today),
    )
    .sort((a, b) => (a.next_follow_up ?? "").localeCompare(b.next_follow_up ?? ""));

  const selectedItems = byDay.get(selected) ?? [];
  const monthLabel = cursor.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });

  const shift = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground">Kalendář</p>
          <h1 className="mt-1 text-3xl font-bold">Follow-upy v čase</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Každý den ukazuje leady, kterým ses ten den zavázal ozvat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            size="icon-sm"
            aria-label="Předchozí měsíc"
            onClick={() => shift(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="label-mono w-40 text-center capitalize">{monthLabel}</span>
          <Button variant="quiet" size="icon-sm" aria-label="Další měsíc" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
          <Button
            variant="ink"
            size="sm"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(toKey(today));
            }}
          >
            Dnes
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card lg:col-span-2">
          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="label-mono px-2 pb-2 text-center text-muted-foreground">
                {d}
              </div>
            ))}
            {days.map((d) => {
              const key = toKey(d);
              const items = byDay.get(key) ?? [];
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = key === toKey(today);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "flex min-h-20 flex-col rounded-xl border p-2 text-left transition-colors",
                    selected === key
                      ? "border-ink bg-secondary"
                      : "border-border hover:bg-secondary/60",
                    !inMonth && "opacity-40",
                  )}
                >
                  <span
                    className={cn("label-mono", isToday ? "text-gold" : "text-muted-foreground")}
                  >
                    {d.getDate()}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {items.slice(0, 3).map((l) => (
                      <span
                        key={l.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isDue(l.next_follow_up) ? "bg-lost" : "bg-gold",
                        )}
                      />
                    ))}
                  </span>
                  {items.length > 0 && (
                    <span className="mt-auto truncate text-xs text-muted-foreground">
                      {items.length} follow-up{items.length > 1 ? "y" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {isLoading && <p className="mt-3 text-xs text-muted-foreground">Načítám…</p>}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" /> {formatDate(selected)}
            </h2>
            {selectedItems.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Na tento den nic naplánováno.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedItems.map((l) => (
                  <li key={l.id} className="rounded-xl border border-border p-3">
                    <button
                      type="button"
                      onClick={() => openLead(l)}
                      className="font-medium hover:underline"
                    >
                      {l.name}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StageChip stage={l.stage} />
                      <span className="label-mono text-muted-foreground">
                        {formatCzk(l.value_czk)}
                      </span>
                    </div>
                    {l.follow_up_note && (
                      <p className="mt-2 text-xs text-muted-foreground">{l.follow_up_note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="label-mono text-lost">Po termínu ({overdue.length})</h2>
            {overdue.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nic nezůstalo viset.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {overdue.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 py-2">
                    <button
                      type="button"
                      onClick={() => openLead(l)}
                      className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                    >
                      {l.name}
                    </button>
                    <span className="label-mono shrink-0 text-lost">
                      {formatDate(l.next_follow_up)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <LeadSheet open={sheetOpen} onOpenChange={setSheetOpen} lead={editingLead} reps={reps} />
    </div>
  );
}
