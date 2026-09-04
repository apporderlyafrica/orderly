import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Package, Users, ShoppingBag, ArrowRight, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function OnboardingWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const meta = ((user as any)?.user_metadata ?? {}) as { role?: string; orgName?: string };
  const name = (user?.email ?? "vous").split("@")[0];
  const isClient = meta.role === "client";

  const [step, setStep] = useState(0);
  if (!open) return null;

  const next = () => setStep((s) => s + 1);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-lg bg-surface border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Bienvenue dans Orderly
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {step === 0 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bonjour {name} 👋</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Votre espace <span className="font-medium text-foreground">{meta.orgName || "Orderly"}</span> est prêt.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isClient
                  ? "Vous pourrez suivre l'état de vos commandes en temps réel."
                  : "Créez vos produits, ajoutez vos commerçants & canaux, puis enregistrez vos commandes."}
              </p>
              <div className="mt-6 rounded-2xl bg-accent/50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">Ce qui vous attend</div>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Un tableau de bord clair</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Le suivi de chaque commande</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Le travail en équipe</li>
                </ul>
              </div>
              <button onClick={next} className="mt-6 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">
                Commencer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold tracking-tight">3 étapes pour démarrer</h1>
              <p className="mt-1 text-sm text-muted-foreground">Complétez votre espace en quelques minutes.</p>
              <div className="mt-5 space-y-2.5">
                <StepLink href="/products" icon={Package} title="Ajouter vos produits" desc="Nom, prix, coût, stock" onClick={next} />
                <StepLink href="/settings" icon={Users} title="Vos commerçants & canaux" desc="Définissez qui travaille, sur quels canaux" onClick={next} />
                <StepLink href="/orders" icon={ShoppingBag} title="Enregistrer une commande" desc="Créez votre première commande" onClick={next} />
              </div>
              <button onClick={next} className="mt-6 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium hover:bg-accent">
                Passer <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
                <Check className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="mt-4 text-xl font-bold tracking-tight">C'est parti ! 🚀</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Vous pouvez commencer à utiliser Orderly. Retrouvez tout dans le menu.
              </p>
              <button onClick={onClose} className="mt-6 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">
                Entrer dans Orderly
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepLink({ href, icon: Icon, title, desc, onClick }: { href: string; icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <Link to={href} onClick={onClick} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:border-foreground/30 transition">
      <span className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-foreground" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
