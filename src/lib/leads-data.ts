import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type Lead = Tables<"leads">;
export type Rep = Tables<"reps">;
export type Activity = Tables<"activities">;

export const leadsQuery = () =>
  queryOptions({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const leadQuery = (id: string) =>
  queryOptions({
    queryKey: ["lead", id],
    queryFn: async (): Promise<Lead> => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

export const repsQuery = () =>
  queryOptions({
    queryKey: ["reps"],
    queryFn: async (): Promise<Rep[]> => {
      const { data, error } = await supabase
        .from("reps")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const activitiesQuery = (leadId: string) =>
  queryOptions({
    queryKey: ["activities", leadId],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export function isDue(date: string | null): boolean {
  if (!date) return false;
  return date <= new Date().toISOString().slice(0, 10);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCzk(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function repName(reps: Rep[], repId: string | null): string {
  if (!repId) return "—";
  return reps.find((r) => r.id === repId)?.name ?? "—";
}

export function repInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
