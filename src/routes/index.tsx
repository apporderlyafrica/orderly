import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShoppingBag, TrendingUp, Truck, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo, LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Orderly — CRM pour vos commandes COD au Sénégal" },
      { name: "description", content: "Centralisez vos commandes Google Sheets, automatisez la comptabilité livraison & closing, fiabilisez votre suivi. Conçu pour e-commerçants au Sénégal." },
    ],
  }),
});

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-foreground transition">Comment ça marche</a>
            <a href="#pricing" className="hover:text-foreground transition">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="h-9 inline-flex items-center px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90">
                Mon espace
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-3 rounded-md text-sm text-muted-foreground hover:text-foreground">
                  Connexion
                </Link>
                <Link to="/signup" className="h-9 inline-flex items-center gap-1.5 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90">
                  Essayer
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-border bg-surface text-[11px] font-medium text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Pensé pour le e-commerce COD au Sénégal
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Gérez vos commandes sans rien laisser au hasard.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Orderly synchronise vos commandes Google Sheets, calcule automatiquement
            les frais de livraison et de closing, et vous montre ce qu'il vous reste réellement —
            après chaque livraison.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link to="/signup" className="h-11 inline-flex items-center justify-center gap-2 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition shadow-[0_8px_30px_-10px_rgba(117,251,144,0.7)]">
              Créer mon compte gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="h-11 inline-flex items-center justify-center px-6 rounded-md border border-border bg-surface text-sm font-medium hover:border-foreground/30 transition">
              J'ai déjà un compte
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Sans carte bancaire · Compte créé en 30 secondes
          </p>
        </div>

        {/* Mock dashboard */}
        <div className="mt-16 sm:mt-20 rounded-2xl border border-border bg-surface p-2 sm:p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)]">
          <div className="rounded-xl border border-border bg-background p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { k: "Reçues", v: "128" },
                { k: "Confirmées", v: "94" },
                { k: "Livrées", v: "71", emph: true },
                { k: "Bénéfice net", v: "412 500 F", emph: true },
              ].map((s) => (
                <div key={s.k} className={`rounded-lg border p-4 ${s.emph ? "bg-foreground text-background border-foreground" : "border-border bg-surface"}`}>
                  <div className={`text-[10px] uppercase tracking-wide font-medium ${s.emph ? "opacity-70" : "text-muted-foreground"}`}>{s.k}</div>
                  <div className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5" /> Synchro Sheets automatique</div>
              <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Zones de livraison Sénégal</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Marge nette par commande</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Tout ce dont vous avez besoin. Rien de plus.</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { i: RefreshCw, t: "Synchro Google Sheets", d: "Importez vos nouvelles commandes depuis votre Sheet en un clic. Les doublons sont ignorés automatiquement." },
            { i: ShoppingBag, t: "Pipeline simple", d: "Nouvelle, à rappeler, confirmée, livrée, annulée. Un statut, une action. Pas de friction." },
            { i: Truck, t: "Comptabilité livraison", d: "Frais Banlieue / Hors banlieue / Régions appliqués automatiquement à chaque livraison." },
            { i: TrendingUp, t: "Marge nette en direct", d: "CA, closing, livraison, coût marchandise. Vous voyez ce qui reste réellement dans la caisse." },
            { i: CheckCircle2, t: "Données fiables", d: "Chaque modification est persistée. Vos suppressions sont définitives. Plus de données fantômes." },
            { i: ShoppingBag, t: "Upsells gérés", d: "Vendez plusieurs produits sur une commande. Tout est compté dans le total et la marge." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-border bg-surface p-6 hover:border-foreground/30 transition">
              <f.i className="h-5 w-5 text-foreground" />
              <h3 className="mt-4 text-base font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-border bg-surface/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Comment ça marche</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Trois étapes, zéro paperasse.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Connectez votre Sheet", d: "Collez l'URL de votre Google Sheet de commandes. Mappez vos colonnes une seule fois." },
              { n: "02", t: "Travaillez vos commandes", d: "Rappelez, confirmez, livrez. Chaque clic met à jour le tableau de bord en temps réel." },
              { n: "03", t: "Encaissez votre marge", d: "À chaque livraison, votre net après frais est calculé pour vous. Plus de calculs en fin de journée." },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="text-5xl font-semibold tabular-nums text-foreground/15">{s.n}</div>
                <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Tarifs</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Gratuit pendant la beta.</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Utilisez Orderly sans limite. Aucune carte requise. Le tarif final sera annoncé en transparence.
          </p>
          <Link to="/signup" className="mt-8 h-11 inline-flex items-center justify-center gap-2 px-6 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
            Commencer maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <LogoMark size={22} />
            <span>© {new Date().getFullYear()} Orderly · Sénégal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground">Connexion</Link>
            <Link to="/signup" className="hover:text-foreground">Créer un compte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
