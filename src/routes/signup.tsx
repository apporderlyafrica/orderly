import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Check, Store, Users, Truck, PackageSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LogoLockup } from "@/components/Logo";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Créer un compte — Orderly" }] }),
});

const ACCOUNT_TYPES = [
  { key: "solo", label: "E-commerçant solo", desc: "Je gère mes commandes avec mon équipe", icon: Store },
  { key: "team", label: "Équipe / service", desc: "Plusieurs utilisateurs, on dispatche", icon: Users },
  { key: "delivery", label: "Service de livraison", desc: "Je livre pour plusieurs e-commerçants", icon: Truck },
  { key: "client", label: "Client", desc: "Je veux suivre l'état de ma commande", icon: PackageSearch },
] as const;

function roleFor(key: string): string {
  return key === "client" ? "client" : "owner";
}

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<string>("solo");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) { const r = (user as any)?.user_metadata?.role; const toOrders = ["client","merchant","closer","deliverer"].includes(r); navigate({ to: toOrders ? "/orders" : "/dashboard" }); }
  }, [user, navigate]);

  function pickType(key: string) {
    setAccountType(key);
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = (orgName.trim() || email.split("@")[0] || "Mon espace");
    if (password.length < 6) { setError("Mot de passe trop court (6 caractères min)."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { accountType, orgName: name, role: roleFor(accountType) },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) navigate({ to: roleFor(accountType) === "client" ? "/orders" : "/dashboard" });
    else setSent(true);
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
        <div className="w-full max-w-md">
          <div className="mb-8">
            <LogoLockup size={40} />
          </div>

          {sent ? (
            <div className="text-center py-10">
              <div className="mx-auto h-12 w-12 rounded-full bg-status-delivered-bg text-status-delivered-fg flex items-center justify-center"><Check className="h-6 w-6" /></div>
              <h1 className="text-xl font-semibold mt-4">Vérifiez votre email</h1>
              <p className="text-sm text-muted-foreground mt-2">Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{email}</span>. Cliquez dessus pour activer votre compte.</p>
              <Link to="/login" className="mt-6 inline-flex items-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold">Aller à la connexion</Link>
            </div>
          ) : step === 1 ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Comment utilisez-vous Orderly ?</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Choisissez votre profil — vous pourrez l'adapter plus tard.</p>
              <div className="mt-7 space-y-2.5">
                {ACCOUNT_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.key} onClick={() => pickType(t.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${accountType === t.key ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-foreground/30"}`}>
                      <span className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-foreground" /></span>
                      <span>
                        <span className="block text-sm font-semibold">{t.label}</span>
                        <span className="block text-xs text-muted-foreground">{t.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="my-6 flex items-center gap-3 text-[11px] text-muted-foreground"><div className="h-px bg-border flex-1" /> OU <div className="h-px bg-border flex-1" /></div>
              <button onClick={onGoogle} className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-medium hover:border-foreground/30 transition"><GoogleIcon /> Continuer avec Google</button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground">← Changer de profil</button>
              <h1 className="text-2xl font-semibold tracking-tight mt-2">{ACCOUNT_TYPES.find((t) => t.key === accountType)?.label}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{ACCOUNT_TYPES.find((t) => t.key === accountType)?.desc}</p>

              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                {accountType !== "client" && (
                  <Field label="Nom de votre espace">
                    <input value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={60} className="input" placeholder="ex: Boutique Awa" />
                  </Field>
                )}
                <Field label="Email">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" placeholder="vous@exemple.com" />
                </Field>
                <Field label="Mot de passe (min. 6 caractères)">
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete="new-password" />
                </Field>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button disabled={loading} className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Créer mon compte
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </main>
      <style>{`.input{width:100%;height:40px;padding:0 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:14px;outline:none}.input:focus{border-color:color-mix(in oklab,var(--foreground) 40%,transparent)}`}</style>
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
