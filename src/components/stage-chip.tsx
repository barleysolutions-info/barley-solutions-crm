import { Link } from "@tanstack/react-router";
import { getStage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export function StageChip({ stage, asLink = false }: { stage: string; asLink?: boolean }) {
  const s = getStage(stage);
  const tone = s?.tone ?? "default";
  const cls = cn(
    "label-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
    tone === "won" && "bg-won-soft text-won",
    tone === "lost" && "bg-lost-soft text-lost",
    tone === "default" && "bg-secondary text-muted-foreground",
  );
  const dot = cn(
    "h-1.5 w-1.5 rounded-full",
    tone === "won" && "bg-won",
    tone === "lost" && "bg-lost",
    tone === "default" && "bg-gold",
  );

  const content = (
    <>
      <span className={dot} />
      {s?.title ?? stage}
    </>
  );

  if (!asLink) return <span className={cls}>{content}</span>;
  return (
    <Link to="/roadmap/$stage" params={{ stage }} className={cn(cls, "hover:text-foreground")}>
      {content}
    </Link>
  );
}
