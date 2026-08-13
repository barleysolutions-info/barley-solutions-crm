import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { myRolesQuery } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/todo", label: "TODO" },
  { to: "/leads", label: "Lead DB" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/calendar", label: "Kalendář" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roles = useQuery(myRolesQuery(user?.id));
  const nav = roles.data?.includes("admin") ? [...NAV, { to: "/admin", label: "Uživatelé" }] : NAV;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="label-mono text-muted-foreground">Načítám…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="brand-radial flex h-10 w-10 items-center justify-center rounded-xl font-display text-base font-bold text-primary-foreground">
              B
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold">Barley Sales Hub</span>
              <span className="block text-xs text-muted-foreground">
                Barley Solutions s.r.o. / TODO, Lead DB, Roadmap
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink text-ink-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="mx-2 hidden text-xs text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Odhlásit se"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-5 py-6">{children}</main>
    </div>
  );
}
