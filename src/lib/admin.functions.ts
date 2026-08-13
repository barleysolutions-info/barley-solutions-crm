import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "sales"]);

async function assertAdmin(context: { supabase: SupabaseClient; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Nemáš oprávnění správce.");
}

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  roles: ("admin" | "sales")[];
};

// No `profiles` table in this project — full name comes straight from the
// `user_metadata` every account already carries (set at signup in login.tsx,
// or at creation time below), so there's nothing extra to keep in sync.
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

    return list.users.map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      fullName: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: Boolean(u.email_confirmed_at),
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: roleSchema, enabled: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin" && !data.enabled) {
      throw new Error("Nemůžeš si odebrat vlastní práva správce.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        fullName: z.string().trim().max(120).optional(),
        role: roleSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName || data.email.split("@")[0] },
    });
    if (error || !created.user)
      throw new Error(error?.message ?? "Uživatele se nepodařilo vytvořit.");

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.role }, { onConflict: "user_id,role" });

    return { id: created.user.id };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        fullName: z.string().trim().max(120).optional(),
        password: z.string().min(8).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        password: data.password,
      });
      if (error) throw new Error(error.message);
    }
    if (data.fullName !== undefined) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        user_metadata: { full_name: data.fullName },
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Nemůžeš smazat vlastní účet.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
