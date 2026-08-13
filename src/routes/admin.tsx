import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { myRolesQuery } from "@/lib/roles";
import {
  createUser,
  deleteUser,
  listUsers,
  setUserRole,
  updateUser,
  type AdminUser,
} from "@/lib/admin.functions";

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Správa uživatelů | Barley Sales Hub" },
      {
        name: "description",
        content: "Administrace týmu — zakládání účtů, role obchodník/správce a mazání uživatelů.",
      },
      { property: "og:title", content: "Správa uživatelů | Barley Sales Hub" },
      { property: "og:description", content: "Administrace týmu a rolí." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppShell>
      <AdminContent />
    </AppShell>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const roles = useQuery(myRolesQuery(user?.id));
  const isAdmin = roles.data?.includes("admin") ?? false;

  const fetchUsers = useServerFn(listUsers);
  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: () => fetchUsers({}),
  });

  const roleFn = useServerFn(setUserRole);
  const removeFn = useServerFn(deleteUser);

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "sales"; enabled: boolean }) =>
      roleFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["my-roles"] });
      toast.success("Role upravena.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Uživatel smazán.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (roles.isLoading) {
    return <p className="label-mono text-muted-foreground">Načítám…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-bold">Přístup jen pro správce</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tuto sekci vidí pouze uživatelé s rolí správce. Požádej někoho z adminů o přidělení role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground">Administrace</p>
          <h1 className="font-display text-2xl font-bold">Správa uživatelů</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zakládej účty obchodníkům, spravuj role a odebírej přístup.
          </p>
        </div>
        <CreateUserDialog />
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-mono px-4 py-3 text-muted-foreground">Uživatel</th>
                <th className="label-mono px-4 py-3 text-muted-foreground">Poslední přihlášení</th>
                <th className="label-mono px-4 py-3 text-muted-foreground">Obchodník</th>
                <th className="label-mono px-4 py-3 text-muted-foreground">Správce</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Načítám uživatele…
                  </td>
                </tr>
              )}
              {users.data?.map((u: AdminUser) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="brand-radial flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground">
                        {initials(u.fullName || u.email)}
                      </span>
                      <span>
                        <span className="block font-medium">{u.fullName || "Bez jména"}</span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.lastSignInAt
                      ? new Date(u.lastSignInAt).toLocaleDateString("cs-CZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={u.roles.includes("sales")}
                      onCheckedChange={(v) =>
                        roleMutation.mutate({ userId: u.id, role: "sales", enabled: v })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={u.roles.includes("admin")}
                      onCheckedChange={(v) =>
                        roleMutation.mutate({ userId: u.id, role: "admin", enabled: v })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <EditUserDialog user={u} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Smazat uživatele">
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Smazat {u.fullName || u.email}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Účet bude nenávratně odstraněn. Leady, které vlastní, zůstanou v CRM.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Zrušit</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(u.id)}>
                              Smazat
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateUserDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "sales">("sales");
  const create = useServerFn(createUser);

  const mutation = useMutation({
    mutationFn: () => create({ data: { email, fullName, password, role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Uživatel vytvořen.");
      setOpen(false);
      setEmail("");
      setFullName("");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ink">
          <Plus /> Nový uživatel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový uživatel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="label-mono text-muted-foreground">Jméno</Label>
            <Input
              className="mt-1.5"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label className="label-mono text-muted-foreground">E-mail</Label>
            <Input
              className="mt-1.5"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="label-mono text-muted-foreground">Heslo (min. 8 znaků)</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label className="label-mono text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "sales")}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Obchodník</SelectItem>
                <SelectItem value="admin">Správce</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ink"
            disabled={mutation.isPending || !email || password.length < 8}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Vytvořit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user }: { user: AdminUser }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [password, setPassword] = useState("");
  const update = useServerFn(updateUser);

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          userId: user.id,
          fullName,
          ...(password.length >= 8 ? { password } : {}),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Uloženo.");
      setOpen(false);
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Upravit uživatele">
          <UserCog />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upravit {user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="label-mono text-muted-foreground">Jméno</Label>
            <Input
              className="mt-1.5"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label className="label-mono text-muted-foreground">Nové heslo (nepovinné)</Label>
            <Input
              className="mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ink" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
