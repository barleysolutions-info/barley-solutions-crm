import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lookupIco, summarizeLead } from "@/lib/leads.functions";
import { LEAD_SOURCES } from "@/lib/pipeline";
import { EMPTY_LEAD_FORM, leadFormSchema, type LeadFormValues } from "@/lib/lead-schema";
import type { Lead, Rep } from "@/lib/leads-data";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { ActivityLog } from "./activity-log";

function fromLead(lead: Lead): LeadFormValues {
  return {
    name: lead.name,
    ico: lead.ico ?? "",
    dic: lead.dic ?? "",
    address: lead.address ?? "",
    city: lead.city ?? "",
    zip: lead.zip ?? "",
    legal_form: lead.legal_form ?? "",
    contact_person: lead.contact_person ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    niche: lead.niche ?? "",
    source: lead.source,
    owner_rep_id: lead.owner_rep_id ?? "",
    sourced_by_rep_id: lead.sourced_by_rep_id ?? "",
    value_czk: lead.value_czk != null ? String(lead.value_czk) : "",
    customer_value_czk: lead.customer_value_czk != null ? String(lead.customer_value_czk) : "",
    next_follow_up: lead.next_follow_up ?? "",
    follow_up_note: lead.follow_up_note ?? "",
    notes: lead.notes ?? "",
  };
}

function toPayload(values: LeadFormValues): TablesInsert<"leads"> {
  return {
    name: values.name.trim(),
    ico: values.ico || null,
    dic: values.dic || null,
    address: values.address || null,
    city: values.city || null,
    zip: values.zip || null,
    legal_form: values.legal_form || null,
    contact_person: values.contact_person || null,
    email: values.email || null,
    phone: values.phone || null,
    website: values.website || null,
    niche: values.niche || null,
    source: values.source,
    owner_rep_id: values.owner_rep_id || null,
    sourced_by_rep_id: values.sourced_by_rep_id || null,
    value_czk: values.value_czk ? Number(values.value_czk) : null,
    customer_value_czk: values.customer_value_czk ? Number(values.customer_value_czk) : null,
    next_follow_up: values.next_follow_up || null,
    follow_up_note: values.follow_up_note || null,
    notes: values.notes || null,
  };
}

export function LeadSheet({
  open,
  onOpenChange,
  lead,
  reps,
  defaultStage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | undefined;
  reps: Rep[];
  defaultStage?: Lead["stage"] | undefined;
}) {
  const qc = useQueryClient();
  const lookupIcoFn = useServerFn(lookupIco);
  const summarizeLeadFn = useServerFn(summarizeLead);
  const [aresLoading, setAresLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: EMPTY_LEAD_FORM,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(lead ? fromLead(lead) : EMPTY_LEAD_FORM);
  }, [open, lead, form]);

  const activeReps = reps.filter((r) => r.active);

  const autofill = async () => {
    const ico = form.getValues("ico");
    if (!ico || ico.replace(/\D/g, "").length < 6) {
      toast.error("Zadej platné IČO.");
      return;
    }
    setAresLoading(true);
    try {
      const data = await lookupIcoFn({ data: { ico } });
      form.setValue("name", data.name || form.getValues("name"));
      form.setValue("ico", data.ico);
      form.setValue("dic", data.dic ?? form.getValues("dic"));
      form.setValue("address", data.address ?? form.getValues("address"));
      form.setValue("city", data.city ?? form.getValues("city"));
      form.setValue("zip", data.zip ?? form.getValues("zip"));
      form.setValue("legal_form", data.legalForm ?? form.getValues("legal_form"));
      toast.success("Údaje doplněny z rejstříku.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nepodařilo se načíst IČO.");
    } finally {
      setAresLoading(false);
    }
  };

  const runSummary = async () => {
    if (!lead) return;
    setSummarizing(true);
    try {
      await summarizeLeadFn({ data: { leadId: lead.id } });
      await qc.invalidateQueries({ queryKey: ["leads"] });
      await qc.invalidateQueries({ queryKey: ["lead", lead.id] });
    } catch {
      toast.error("Shrnutí se nepodařilo vytvořit.");
    } finally {
      setSummarizing(false);
    }
  };

  const save = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const payload = toPayload(values);
      if (lead) {
        const update: TablesUpdate<"leads"> = payload;
        const { error } = await supabase.from("leads").update(update).eq("id", lead.id);
        if (error) throw error;
        return lead.id;
      }
      const { data, error } = await supabase.from("leads").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(lead ? "Lead upraven." : "Lead přidán.");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead smazán.");
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{lead ? "Upravit lead" : "Nový lead"}</SheetTitle>
          <SheetDescription>
            Zadej IČO a nech si zbytek doplnit z veřejného rejstříku.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            className="mt-6 space-y-6"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-mono text-muted-foreground">IČO</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="např. 27074358" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="gold"
                          onClick={autofill}
                          disabled={aresLoading}
                        >
                          {aresLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                          Načíst
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TextField control={form.control} name="name" label="Název firmy *" />
              <TextField control={form.control} name="dic" label="DIČ" />
              <TextField control={form.control} name="contact_person" label="Kontaktní osoba" />
              <TextField control={form.control} name="email" label="E-mail" type="email" />
              <TextField control={form.control} name="phone" label="Telefon" />
              <TextField control={form.control} name="website" label="Web" />
              <TextField control={form.control} name="address" label="Adresa" />
              <TextField control={form.control} name="city" label="Město" />
              <TextField control={form.control} name="zip" label="PSČ" />
              <TextField control={form.control} name="niche" label="Nika / segment" />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-mono text-muted-foreground">Zdroj</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner_rep_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-mono text-muted-foreground">
                      Vlastník leadu *
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyber obchodníka" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeReps.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourced_by_rep_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-mono text-muted-foreground">
                      Kdo lead sehnal
                    </FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nevyplněno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeReps.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TextField
                control={form.control}
                name="value_czk"
                label="Hodnota obchodu (Kč)"
                type="number"
              />
              <TextField
                control={form.control}
                name="customer_value_czk"
                label="Hodnota 1 zákazníka klienta (Kč)"
                type="number"
              />
              <TextField
                control={form.control}
                name="next_follow_up"
                label="Další follow-up"
                type="date"
              />
              <div className="sm:col-span-2">
                <TextField
                  control={form.control}
                  name="follow_up_note"
                  label="Co udělat při follow-upu"
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-mono text-muted-foreground">Poznámky</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              {lead ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="quiet">
                      <Trash2 /> Smazat
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Opravdu smazat {lead.name}?</AlertDialogTitle>
                      <AlertDialogDescription>Tuto akci nelze vrátit.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Zrušit</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate()}>Smazat</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span />
              )}
              <Button type="submit" variant="ink" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                Uložit
              </Button>
            </div>
          </form>
        </Form>

        {lead && (
          <div className="mt-6 space-y-6 border-t border-border pt-6">
            <div className="rounded-2xl bg-ink p-5 text-ink-foreground shadow-node">
              <h3 className="label-mono flex items-center gap-2 text-gold">
                <Sparkles className="h-4 w-4" /> AI shrnutí a další krok
              </h3>
              {lead.ai_summary ? (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">
                  {lead.ai_summary}
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-foreground/70">
                  Nech si z historie jednání vytáhnout shrnutí, riziko a další krok.
                </p>
              )}
              <Button
                variant="gold"
                className="mt-4"
                type="button"
                onClick={runSummary}
                disabled={summarizing}
              >
                {summarizing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {lead.ai_summary ? "Přegenerovat" : "Vygenerovat"}
              </Button>
            </div>

            <ActivityLog leadId={lead.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TextField({
  control,
  name,
  label,
  type = "text",
}: {
  control: ReturnType<typeof useForm<LeadFormValues>>["control"];
  name: keyof LeadFormValues;
  label: string;
  type?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="label-mono text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
