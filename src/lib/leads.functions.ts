import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STAGE_KEYS, getStage, stageLabel } from "@/lib/pipeline";
import { addDays } from "@/lib/leads-data";

export const lookupIco = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ ico: z.string().min(6).max(12) }).parse(data))
  .handler(async ({ data }) => {
    const { fetchAres } = await import("./leads.server");
    return fetchAres(data.ico);
  });

// Stage transitions can come from drag-and-drop or the list view, both of
// which bypass the LeadSheet form entirely — the required-field rules
// (customer value before leaving kickoff; who closed it + why, before
// won/lost) must therefore be enforced here, server-side, not just in the
// form's zod schema.
export const moveLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        toStage: z.enum(STAGE_KEYS),
        lostReason: z.string().min(1).optional(),
        closedByRepId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (error || !lead) throw new Error("Lead nenalezen.");

    if (lead.stage === "kickoff" && data.toStage !== "kickoff" && lead.customer_value_czk == null) {
      throw new Error("Vyplň hodnotu jednoho zákazníka, než lead posuneš z kick-off dál.");
    }
    if (data.toStage === "won" && !data.closedByRepId) {
      throw new Error("Vyber, kdo lead uzavřel.");
    }
    if (data.toStage === "lost" && (!data.closedByRepId || !data.lostReason)) {
      throw new Error("Vyber, kdo lead uzavřel, a zapiš důvod ztráty.");
    }

    const target = getStage(data.toStage);
    const { error: updateErr } = await context.supabase
      .from("leads")
      .update({
        stage: data.toStage,
        closed_by_rep_id: data.closedByRepId ?? lead.closed_by_rep_id,
        lost_reason: data.toStage === "lost" ? (data.lostReason ?? null) : lead.lost_reason,
        next_follow_up: target?.followUpDays ? addDays(target.followUpDays) : lead.next_follow_up,
      })
      .eq("id", data.leadId);
    if (updateErr) throw updateErr;

    await context.supabase.from("activities").insert({
      lead_id: data.leadId,
      user_id: context.userId,
      kind: "stage_change",
      content: `Fáze změněna: ${stageLabel(lead.stage)} → ${stageLabel(data.toStage)}`,
    });

    return { ok: true };
  });

export const summarizeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { askAi } = await import("./leads.server");

    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (error || !lead) throw new Error("Lead nenalezen.");

    const { data: activities } = await context.supabase
      .from("activities")
      .select("kind, content, created_at")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false })
      .limit(30);

    const stage = getStage(lead.stage);

    const summary = await askAi(
      "Jsi zkušený B2B sales konzultant. Odpovídej česky, věcně, bez omáček a bez markdown nadpisů. Maximálně 140 slov.",
      [
        `Lead: ${lead.name}`,
        `Fáze: ${stage?.title ?? lead.stage} (${stage?.subtitle ?? ""})`,
        `Kontakt: ${lead.contact_person ?? "—"}, ${lead.email ?? "—"}, ${lead.phone ?? "—"}`,
        `Zdroj: ${lead.source} | Nika: ${lead.niche ?? "—"} | Hodnota: ${lead.value_czk ?? "—"} Kč`,
        `Hodnota 1 zákazníka klienta: ${lead.customer_value_czk ?? "—"} Kč`,
        `Další follow-up: ${lead.next_follow_up ?? "nenastaven"}`,
        `Poznámky: ${lead.notes ?? "—"}`,
        "Historie aktivit (od nejnovější):",
        (activities ?? [])
          .map(
            (a) =>
              `- [${a.kind}] ${new Date(a.created_at).toLocaleDateString("cs-CZ")}: ${a.content}`,
          )
          .join("\n") || "- žádné aktivity",
        "",
        "Napiš: 1) shrnutí situace 2 věty, 2) riziko, 3) konkrétní další krok, který má obchodník udělat teď. Použij prostý text s odrážkami '-'.",
      ].join("\n"),
    );

    await context.supabase.from("leads").update({ ai_summary: summary }).eq("id", data.leadId);
    return { summary };
  });

export const analyzePipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { askAi } = await import("./leads.server");

    const { data: leads } = await context.supabase
      .from("leads")
      .select("name, stage, value_czk, next_follow_up, source, updated_at, lost_reason")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (!leads || leads.length === 0) {
      return {
        analysis: "Zatím nemáš žádné leady. Přidej prvního klienta a analýza se objeví tady.",
      };
    }

    const analysis = await askAi(
      "Jsi sales manager, který čte pipeline a dává jasné pokyny. Odpovídej česky, prostým textem s odrážkami '-', maximálně 180 slov, bez markdown nadpisů.",
      [
        `Dnešní datum: ${new Date().toISOString().slice(0, 10)}`,
        "Pipeline:",
        leads
          .map(
            (l) =>
              `- ${l.name} | fáze: ${l.stage} | zdroj: ${l.source} | hodnota: ${l.value_czk ?? "?"} | follow-up: ${l.next_follow_up ?? "žádný"} | poslední změna: ${l.updated_at.slice(0, 10)}${l.lost_reason ? ` | prohra: ${l.lost_reason}` : ""}`,
          )
          .join("\n"),
        "",
        "Napiš: stav pipeline, kde to vázne, 3 konkrétní priority na dnešek se jmény firem.",
      ].join("\n"),
    );

    return { analysis };
  });
