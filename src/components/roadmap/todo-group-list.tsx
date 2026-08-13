import { CircleDot } from "lucide-react";
import type { TodoGroup } from "@/lib/pipeline";

export function TodoGroupList({ group }: { group: TodoGroup }) {
  return (
    <section>
      <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
        <span className="h-2 w-2 bg-ink" />
        {group.heading}
      </h3>
      <ul className="mt-3 space-y-3">
        {group.items.map((item) => (
          <li key={item} className="flex gap-3 border-b border-border/60 pb-3 last:border-0">
            <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
