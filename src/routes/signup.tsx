import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LogoLockup } from "@/components/Logo";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Créer un compte — Orderly" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Mot de passe trop court (6 caractères min)."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else navigate({ to: "/dashboard" });
  }

  async function onGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-16 px-5 sm:px-8 flex items-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <LogoLockup size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Gratuit · 30 secondes.</p>

          <button
            onClick={onGoogle}
            className="mt-7 w-full h-10 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-medium hover:border-foreground/30 transition"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="h-px bg-border flex-1" /> OU <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
            </Field>
            <Field label="Mot de passe (min. 6 caractères)">
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
            </Field>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button disabled={loading} className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-60">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Créer mon compte
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </main>
      <style>{`.input{width:100%;height:40px;padding:0 12px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:14px;outline:none}.input:focus{border-color:color-mix(in oklab,var(--foreground) 40%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.99 6.99 0 0 1 5.46 12c0-.73.13-1.44.36-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
