import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users, Radio, Wallet, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatXOF } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Paramètres — Orderly" }] }),
});

function SettingsPage() {
  const { settings, updateSettings, users, channels, addUser, addChannel } = useStore();

  async function promptAddUser() {
    const raw = window.prompt("Nom du commerçant :");
    if (!raw) return;
    const name = raw.trim();
    if (name) await addUser(name);
  }
  async function promptAddChannel() {
    const raw = window.prompt("Nom du canal :");
    if (!raw) return;
    const name = raw.trim();
    if (name) await addChannel(name);
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-5xl">
      <header className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Configuration</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Frais, commerçants et canaux d'acquisition. Vos choix sont enregistrés en local.
        </p>
      </header>

      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Paramètres financiers</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Le coût marchandise utilise le coût défini sur chaque produit. Modifiable à tout moment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <NumField label="Closing (confirmée/livrée)" value={settings.closingFee} onChange={(v) => updateSettings({ closingFee: v })} suffix="FCFA" />
          <NumField label="Livraison · Dakar & Banlieue" value={settings.deliveryFeeBanlieue} onChange={(v) => updateSettings({ deliveryFeeBanlieue: v })} suffix="FCFA" />
          <NumField label="Livraison · Hors banlieue" value={settings.deliveryFeeHorsBanlieue} onChange={(v) => updateSettings({ deliveryFeeHorsBanlieue: v })} suffix="FCFA" />
          <NumField label="Livraison · Régions" value={settings.deliveryFeeRegion} onChange={(v) => updateSettings({ deliveryFeeRegion: v })} suffix="FCFA" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Commerçants</h2>
            </div>
            <button onClick={promptAddUser} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Les personnes qui traitent les commandes. Un produit peut être rattaché à un commerçant.</p>
          <ul className="space-y-2">
            {users.length === 0 && <p className="text-xs text-muted-foreground">Aucun commerçant.</p>}
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/40">
                <span className="h-6 w-6 rounded-md bg-primary/20 text-primary-foreground inline-flex items-center justify-center text-[10px] font-bold">{u.name.slice(0, 1).toUpperCase()}</span>
                <span className="text-sm font-medium">{u.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Canaux d'acquisition</h2>
            </div>
            <button onClick={promptAddChannel} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">D'où viennent les commandes : WhatsApp, Shopify, boutique, etc.</p>
          <ul className="space-y-2">
            {channels.length === 0 && <p className="text-xs text-muted-foreground">Aucun canal.</p>}
            {channels.map((c) => (
              <li key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/40">
                <span className="h-6 w-6 rounded-md bg-status-new-bg text-status-new-fg inline-flex items-center justify-center text-[10px] font-bold">{c.name.slice(0, 1).toUpperCase()}</span>
                <span className="text-sm font-medium">{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 mt-6">
        <h2 className="text-sm font-semibold mb-2">Synchro Google Sheets</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Cette fonctionnalité (import des commandes depuis un Google Sheet) nécessite une clé API — non fournie pour l'instant.
        </p>
        <a href="/sync" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Ouvrir la page Synchro
        </a>
      </section>
    </div>
  );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number" inputMode="numeric" min={0} value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full h-10 pl-3 pr-16 rounded-md border border-border bg-surface text-sm tabular-nums outline-none focus:border-foreground/40"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
