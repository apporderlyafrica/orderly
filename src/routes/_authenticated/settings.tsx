import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users, Radio, Wallet, UserPlus, ShieldCheck, UserRound, Mail, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatXOF } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  member: "Équipe",
  merchant: "Commerçant",
  closer: "Closer",
  client: "Client",
};

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Paramètres — Orderly" }] }),
});

function SettingsPage() {
  const { settings, updateSettings, users, channels, addUser, addChannel, teamMembers, addMember, updateMember, removeMember, renameChannel, removeChannel, renameUser, removeUser } = useStore();
  const { user } = useAuth();
  const meta = ((user as any)?.user_metadata ?? {}) as { role?: string; orgName?: string };
  const isOwner = meta.role === "owner" || meta.role === undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [merchantId, setMerchantId] = useState("");
  const [mErr, setMErr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState("member");
  const [eMerchantId, setEMerchantId] = useState("");

  function startEdit(m: { id: string; name: string; email?: string; role: string; merchantId?: string }) {
    setEditId(m.id); setEName(m.name); setEEmail(m.email ?? ""); setERole(m.role); setEMerchantId(m.merchantId ?? "");
  }
  async function saveEdit(m: { id: string }) {
    setMErr(null);
    try {
      await updateMember({ id: m.id, name: eName.trim(), email: eEmail.trim() || undefined, role: eRole, merchantId: eRole === "merchant" ? (eMerchantId || undefined) : undefined });
      setEditId(null);
    } catch (err: any) { setMErr("Impossible de modifier : " + String(err?.message || err).slice(0, 120)); }
  }

  async function removeMerchant(u: { id: string; name: string }) {
    if (!window.confirm(`Supprimer le commerçant « ${u.name} » ?`)) return;
    await removeUser(u.id);
  }
  async function renameMerchant(u: { id: string; name: string }) {
    const raw = window.prompt("Nouveau nom du commerçant :", u.name);
    if (!raw || !raw.trim() || raw.trim() === u.name) return;
    await renameUser(u.id, raw.trim());
  }
  async function removeChannelX(c: { id: string; name: string }) {
    if (!window.confirm(`Supprimer le canal « ${c.name} » ?`)) return;
    await removeChannel(c.id);
  }
  async function renameChannelX(c: { id: string; name: string }) {
    const raw = window.prompt("Nouveau nom du canal :", c.name);
    if (!raw || !raw.trim() || raw.trim() === c.name) return;
    await renameChannel(c.id, raw.trim());
  }

  async function submitMember(e: React.FormEvent) {
    e.preventDefault();
    setMErr(null);
    if (!name.trim()) { setMErr("Nom requis."); return; }
    if (email && !email.includes("@")) { setMErr("Email invalide."); return; }
    try {
      await addMember({ name: name.trim(), email: email.trim() || undefined, role, merchantId: role === "merchant" ? (merchantId || undefined) : undefined });
      setName(""); setEmail(""); setRole("member"); setMerchantId("");
    } catch (err: any) {
      const msg = String(err?.message || err || "erreur inconnue");
      setMErr("Impossible d'ajouter le membre : " + msg.slice(0, 140));
    }
  }

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
                <span className="text-sm font-medium flex-1 truncate">{u.name}</span>
                <RowActions onEdit={() => renameMerchant(u)} onDelete={() => removeMerchant(u)} />
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
                <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                <RowActions onEdit={() => renameChannelX(c)} onDelete={() => removeChannelX(c)} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Équipe & accès */}
      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 mt-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Équipe & accès</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full bg-accent text-accent-foreground px-2.5 py-1">
            <UserRound className="h-3 w-3" /> {ROLE_LABELS[meta.role ?? "owner"]} · {meta.orgName ?? "Mon espace"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Ajoutez les personnes qui travaillent sur cet espace. Rôles : <b>Équipe</b> (voyez tout), <b>Commerçant</b> (voit ses commandes), <b>Client</b> (voit sa commande).
        </p>

        {isOwner ? (
          <form onSubmit={submitMember} className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optionnel)" className="h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
                <option value="member">Équipe</option>
                <option value="closer">Closer</option>
                <option value="merchant">Commerçant</option>
                <option value="client">Client</option>
              </select>
              <button type="submit" className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">
                <UserPlus className="h-4 w-4" /> Ajouter
              </button>
            </div>
            {role === "merchant" && (
              <div className="mt-2 sm:max-w-sm">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Commerçant rattaché (il ne verra que ses commandes)</label>
                <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
                  <option value="">— Aucun —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </form>
        ) : (
          <p className="text-xs text-muted-foreground mb-4">Seul le propriétaire peut ajouter des membres.</p>
        )}
        {mErr && <p className="text-xs text-status-cancelled-fg bg-status-cancelled-bg rounded-md px-3 py-2 mb-3">{mErr}</p>}

        <ul className="space-y-2">
          {teamMembers.length === 0 && <p className="text-xs text-muted-foreground">Aucun membre ajouté pour l'instant.</p>}
          {teamMembers.map((m) => {
            const editing = editId === m.id;
            return (
              <li key={m.id} className={`rounded-md px-3 py-2 ${editing ? "border border-accent bg-accent/30" : "bg-muted/40"}`}>
                {editing ? (
                  <div className="space-y-2">
                    <input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Nom" className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
                    <input value={eEmail} onChange={(e) => setEEmail(e.target.value)} type="email" placeholder="Email (optionnel)" className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
                    <select value={eRole} onChange={(e) => setERole(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
                      <option value="member">Équipe</option>
                      <option value="closer">Closer</option>
                      <option value="merchant">Commerçant</option>
                      <option value="client">Client</option>
                    </select>
                    {eRole === "merchant" && (
                      <select value={eMerchantId} onChange={(e) => setEMerchantId(e.target.value)} className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
                        <option value="">— Aucun —</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    )}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditId(null)} className="h-8 px-3 rounded-md border border-border text-xs">Annuler</button>
                      <button type="button" onClick={() => saveEdit(m)} className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold">Enregistrer</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-8 w-8 rounded-lg bg-primary/20 text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{(m.name || m.email || "?").slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.name || "—"}</div>
                        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">{m.email ? <><Mail className="h-3 w-3" /> {m.email}</> : "Sans email"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center text-[11px] font-medium rounded-full bg-status-new-bg text-status-new-fg px-2 py-0.5">{ROLE_LABELS[m.role] ?? m.role}</span>
                      <RowActions onEdit={() => startEdit(m)} onDelete={() => { if (window.confirm(`Supprimer le membre « ${m.name} » ?`)) removeMember(m.id); }} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

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

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} aria-label="Modifier" title="Modifier" className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} aria-label="Supprimer" title="Supprimer" className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border text-status-cancelled-fg hover:bg-status-cancelled-bg"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {  return (
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
