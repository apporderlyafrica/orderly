import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound, ShieldCheck, Building2, Mail, Package, ShoppingBag, Users, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profil — Orderly" }] }),
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { orders, products, users, channels } = useStore();
  const navigate = useNavigate();

  const initials = (user?.email ?? "O").slice(0, 1).toUpperCase();
  const name = (user as any)?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilisateur local";

  async function logout() {
    await signOut();
    navigate({ to: "/" });
  }

  const meta = ((user as any)?.user_metadata ?? {}) as { role?: string; orgName?: string; accountType?: string };
  const roleLabel = (role?: string) =>
    role === "client" ? "Client" : role === "merchant" ? "Commerçant" : role === "closer" ? "Closer" : "Propriétaire / Équipe";

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-3xl mx-auto">
      <header className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Compte</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Profil</h1>
      </header>

      {/* Identité */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-7 mb-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-primary-foreground shadow-[0_8px_30px_-12px_rgba(117,251,144,0.8)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight capitalize truncate">{name}</div>
            <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full bg-status-delivered-bg text-status-delivered-fg px-2 py-0.5">
              <ShieldCheck className="h-3 w-3" />
              Compte local · sans inscription
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <MiniStat icon={ShoppingBag} label="Commandes" value={orders.length} />
          <MiniStat icon={Package} label="Produits" value={products.length} />
          <MiniStat icon={Users} label="Commerçants" value={users.length} />
          <MiniStat icon={Radio} label="Canaux" value={channels.length} />
        </div>
      </section>

      {/* Informations */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-7 mb-4">
        <h2 className="text-sm font-semibold mb-3">Informations du compte</h2>
        <div className="space-y-2">
          <InfoRow icon={Mail} label="Email" value={user?.email ?? "—"} />
          <InfoRow icon={UserRound} label="Rôle" value={roleLabel(meta.role)} />
          <InfoRow icon={Building2} label="Espace de travail" value={meta.orgName ?? "—"} />
          <InfoRow icon={ShieldCheck} label="Authentification" value="Compte Supabase" />
        </div>
      </section>

      {/* Déconnexion */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-7">
        <h2 className="text-sm font-semibold mb-2">Session</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Vous êtes connecté en mode local. La déconnexion vous ramène à la page d'accueil.
        </p>
        <button
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-status-cancelled-fg/30 bg-status-cancelled-bg/40 text-status-cancelled-fg text-sm font-semibold hover:bg-status-cancelled-bg transition"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </section>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground underline-offset-2 hover:underline">Paramètres</Link>
        <span>Édition 2026 · Ordrely</span>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-muted/40">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}
