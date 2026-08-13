import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "sales";

export const myRolesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-roles", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
