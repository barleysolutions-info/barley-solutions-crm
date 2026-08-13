import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Stage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { TodoGroupList } from "./todo-group-list";

export function StagePlaybook({
  stage,
  count,
  showLink = false,
}: {
  stage: Stage;
  count?: number;
  showLink?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "border-l-4 pl-4",
          stage.tone === "won"
            ? "border-won"
            : stage.tone === "lost"
              ? "border-lost"
              : "border-gold",
        )}
      >
        <p className="label-mono text-muted-foreground">{stage.num}</p>
        <h2 className="mt-1 text-2xl font-bold">{stage.title}</h2>
        <p className="text-sm text-muted-foreground">{stage.subtitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
        {count != null && (
          <p className="label-mono mt-3 text-muted-foreground">
            {count} {count === 1 ? "lead v této fázi" : "leadů v této fázi"}
          </p>
        )}
      </div>

      {stage.todoGroups.map((group) => (
        <TodoGroupList key={group.heading} group={group} />
      ))}

      {stage.requiredField && (
        <section
          className={cn(
            "rounded-xl border-2 border-dashed px-4 py-3",
            stage.tone === "lost" ? "border-lost" : "border-gold",
          )}
        >
          <p
            className={cn(
              "label-mono",
              stage.tone === "lost" ? "text-lost" : "text-accent-foreground",
            )}
          >
            {stage.requiredField.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{stage.requiredField.description}</p>
        </section>
      )}

      {stage.preCloseChecklist && (
        <section>
          <SectionTitle>{stage.preCloseChecklist.heading}</SectionTitle>
          <ul className="mt-3 space-y-2">
            {stage.preCloseChecklist.items.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                - {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>Výstup</SectionTitle>
        <p className="mt-2 rounded-xl bg-gold-soft px-4 py-3 text-sm leading-relaxed">
          {stage.output}
        </p>
      </section>

      <section>
        <SectionTitle>Další krok</SectionTitle>
        <p className="mt-2 text-sm font-medium">{stage.next}</p>
      </section>

      {showLink && (
        <Link
          to="/roadmap/$stage"
          params={{ stage: stage.key }}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Otevřít fázi s leady
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
      <span className="h-2 w-2 bg-ink" />
      {children}
    </h3>
  );
}
