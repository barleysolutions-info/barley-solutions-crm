import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Přihlášení | Barley Sales Hub" },
      {
        name: "description",
        content: "Přihlas se do Barley Sales Hub a pokračuj v sales procesu.",
      },
      { property: "og:title", content: "Přihlášení | Barley Sales Hub" },
      {
        property: "og:description",
        content: "Přihlas se do Barley Sales Hub a pokračuj v sales procesu.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/" });
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Účet vytvořen. Zkontroluj e-mail, pokud je potřeba potvrzení.");
  };

  return (
    <div className="dotted-canvas flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3">
          <span className="brand-radial flex h-11 w-11 items-center justify-center rounded-xl font-display text-lg font-bold text-primary-foreground">
            B
          </span>
          <div>
            <h1 className="text-xl font-bold">Barley Sales Hub</h1>
            <p className="text-xs text-muted-foreground">TODO, Lead DB, Roadmap na jednom místě</p>
          </div>
        </div>

        <Tabs defaultValue="signin" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="signin">
              Přihlášení
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="signup">
              Registrace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <EmailFields
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
            />
            <Button variant="ink" className="w-full" onClick={signIn} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Přihlásit se
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-4">
            <div>
              <Label className="label-mono text-muted-foreground">Jméno</Label>
              <Input
                className="mt-1.5"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <EmailFields
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
            />
            <Button variant="ink" className="w-full" onClick={signUp} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Vytvořit účet
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmailFields({
  email,
  password,
  setEmail,
  setPassword,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
}) {
  return (
    <>
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
        <Label className="label-mono text-muted-foreground">Heslo</Label>
        <Input
          className="mt-1.5"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
