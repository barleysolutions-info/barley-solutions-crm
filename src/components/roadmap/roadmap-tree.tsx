import { ACTIVE_STAGES, getStage } from "@/lib/pipeline";
import type { StageKey } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export function RoadmapTree({
  selected,
  onSelect,
  counts,
  currentStage,
}: {
  selected: StageKey;
  onSelect: (stage: StageKey) => void;
  counts: Record<string, number>;
  currentStage?: string | null;
}) {
  const won = getStage("won")!;
  const lost = getStage("lost")!;

  return (
    <div className="dotted-canvas relative rounded-2xl border border-border bg-card p-6 sm:p-10">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center">
        <span
          className="absolute top-0 bottom-24 left-1/2 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />
        {ACTIVE_STAGES.map((key) => {
          const stage = getStage(key)!;
          return (
            <StageNode
              key={stage.key}
              num={stage.num}
              title={stage.title}
              subtitle={stage.subtitle}
              count={counts[stage.key] ?? 0}
              selected={selected === stage.key}
              current={currentStage === stage.key}
              onClick={() => onSelect(stage.key)}
            />
          );
        })}
      </div>

      <div className="mx-auto mt-8 max-w-3xl border-t border-dashed border-border pt-8">
        <p className="label-mono text-center text-muted-foreground">
          po vyjednávání: buď podpis, nebo zavřít jako lost
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <StageNode
            num={won.num}
            title={won.title}
            subtitle={won.subtitle}
            count={counts["won"] ?? 0}
            tone="won"
            selected={selected === "won"}
            current={currentStage === "won"}
            onClick={() => onSelect("won")}
          />
          <StageNode
            num={lost.num}
            title={lost.title}
            subtitle={lost.subtitle}
            count={counts["lost"] ?? 0}
            tone="lost"
            selected={selected === "lost"}
            current={currentStage === "lost"}
            onClick={() => onSelect("lost")}
          />
        </div>
      </div>
    </div>
  );
}

function StageNode({
  num,
  title,
  subtitle,
  count,
  selected,
  current,
  tone = "default",
  onClick,
}: {
  num: string;
  title: string;
  subtitle: string;
  count: number;
  selected: boolean;
  current?: boolean;
  tone?: "default" | "won" | "lost";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative z-10 my-3 w-full max-w-sm rounded-2xl px-5 py-4 text-left text-ink-foreground shadow-node transition-all",
        tone === "default" && "bg-ink",
        tone === "won" && "bg-ink ring-1 ring-won",
        tone === "lost" && "bg-ink ring-1 ring-lost",
        selected && "-translate-y-0.5 ring-2 ring-gold",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-mono text-ink-foreground/45">{num}</p>
          <p className="mt-0.5 font-display text-lg font-bold">{title}</p>
          <p className="text-sm text-ink-foreground/60">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {count > 0 && (
            <span
              className={cn(
                "label-mono rounded-full px-2 py-1",
                tone === "won" && "bg-won text-ink-foreground",
                tone === "lost" && "bg-lost text-ink-foreground",
                tone === "default" && "bg-gold text-accent-foreground",
              )}
            >
              {count}
            </span>
          )}
          {current && <span className="label-mono text-gold">tady jsi</span>}
        </div>
      </div>
    </button>
  );
}
