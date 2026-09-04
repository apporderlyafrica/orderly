import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";

type Props = { open: boolean; onClose: () => void };

export function NewProductModal({ open, onClose }: Props) {
  const { addProduct, users, channels } = useStore();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [userId, setUserId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const p = Number(price);
    const c = Number(cost);
    const s = stock.trim() === "" ? 0 : Number(stock);
    if (n.length < 2 || n.length > 80) return setError("Nom invalide (2 à 80 caractères).");
    if (!Number.isFinite(p) || p < 0 || p > 100_000_000) return setError("Prix invalide.");
    if (!Number.isFinite(c) || c < 0 || c > 100_000_000) return setError("Coût invalide.");
    if (!Number.isInteger(s) || s < 0 || s > 1_000_000) return setError("Stock invalide.");
    if (c > p) return setError("Le coût ne devrait pas dépasser le prix de vente.");

    addProduct({ name: n, price: p, cost: c, stock: s, userId: userId || undefined, channelId: channelId || undefined });
    setName(""); setPrice(""); setCost(""); setStock(""); setUserId(""); setChannelId("");
    onClose();
  }

  const margin = Number(price) - Number(cost);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-2xl sm:rounded-xl shadow-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 h-14 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-sm font-semibold">Nouveau produit</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Nom du produit">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={inputCls} placeholder="ex: Huile de karité" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix de vente (FCFA)">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                className={inputCls}
                placeholder="ex: 12500"
              />
            </Field>
            <Field label="Coût d'achat (FCFA)">
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                className={inputCls}
                placeholder="ex: 5000"
              />
            </Field>
          </div>
          {Number.isFinite(margin) && Number(price) > 0 && (
            <p className="text-xs text-muted-foreground">
              Marge unitaire : <span className="font-medium text-foreground tabular-nums">{margin.toLocaleString("fr-FR")} FCFA</span>
            </p>
          )}
          <Field label="Stock initial (optionnel)">
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className={inputCls}
              placeholder="ex: 50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Commerçant (optionnel)">
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                <option value="">— Tous —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Canal (optionnel)">
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
                <option value="">— Tous —</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Rattacher un produit à un commerçant/canal permet de ne montrer que son catalogue et d'éviter les doublons à prix différents.
          </p>

          {error && (
            <p className="text-xs text-status-cancelled-fg bg-status-cancelled-bg rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-border text-sm hover:bg-accent">Annuler</button>
            <button type="submit" className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
