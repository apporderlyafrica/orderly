import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatXOF } from "@/lib/format";
import { NewProductModal } from "@/components/NewProductModal";
import type { Product } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Produits — Orderly" }] }),
});

function ProductsPage() {
  const { products, deleteProduct, updateProduct, users, channels } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; price: number; cost: number; stock: number } | null>(null);

  const userName = (id?: string) => users.find((u) => u.id === id)?.name;
  const channelName = (id?: string) => channels.find((c) => c.id === id)?.name;

  function startEdit(p: Product) { setEditingId(p.id); setDraft({ name: p.name, price: p.price, cost: p.cost, stock: p.stock }); }
  function commit() { if (editingId && draft) updateProduct(editingId, draft); setEditingId(null); setDraft(null); }
  function cancel() { setEditingId(null); setDraft(null); }
  function onDelete(p: Product) {
    if (confirm(`Supprimer le produit "${p.name}" ?`)) deleteProduct(p.id);
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-7xl">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Catalogue</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Produits</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {products.length} produit{products.length > 1 ? "s" : ""} · prix, coût, marge & stock
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 shrink-0 shadow-[0_4px_16px_rgba(117,251,144,0.4)]">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau produit</span>
        </button>
      </header>

      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Référence</th>
              <th className="text-left font-medium px-4 py-3">Nom</th>
              <th className="text-right font-medium px-4 py-3">Prix de vente</th>
              <th className="text-right font-medium px-4 py-3">Coût</th>
              <th className="text-right font-medium px-4 py-3">Marge</th>
              <th className="text-right font-medium px-4 py-3">Stock</th>
              <th className="text-right font-medium px-4 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Aucun produit. Créez-en un pour démarrer.</td></tr>
            )}
            {products.map((p) => {
              const isEdit = editingId === p.id;
              const price = isEdit ? draft!.price : p.price;
              const cost = isEdit ? draft!.cost : p.cost;
              const margin = price - cost;
              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">{p.id.toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium">
                    {isEdit ? <input value={draft!.name} onChange={(e) => setDraft({ ...draft!, name: e.target.value })} className={cellInput} /> : (
                      <div>
                        <div>{p.name}</div>
                        {(p.userId || p.channelId) && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.userId && userName(p.userId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{userName(p.userId)}</span>}
                            {p.channelId && channelName(p.channelId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-status-new-bg text-status-new-fg">{channelName(p.channelId)}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isEdit ? <input type="number" min={0} value={draft!.price} onChange={(e) => setDraft({ ...draft!, price: +e.target.value || 0 })} className={`${cellInput} text-right w-28`} /> : formatXOF(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isEdit ? <input type="number" min={0} value={draft!.cost} onChange={(e) => setDraft({ ...draft!, cost: +e.target.value || 0 })} className={`${cellInput} text-right w-28`} /> : formatXOF(p.cost)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${margin > 0 ? "text-status-confirmed-fg" : "text-muted-foreground"}`}>{formatXOF(margin)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {isEdit ? <input type="number" min={0} value={draft!.stock} onChange={(e) => setDraft({ ...draft!, stock: +e.target.value || 0 })} className={`${cellInput} text-right w-20`} /> : (
                      <span className={p.stock < 20 ? "text-status-cancelled-fg" : "text-muted-foreground"}>{p.stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isEdit ? (
                        <>
                          <IconBtn label="Valider" onClick={commit}><Check className="h-4 w-4" /></IconBtn>
                          <IconBtn label="Annuler" onClick={cancel}><X className="h-4 w-4" /></IconBtn>
                        </>
                      ) : (
                        <>
                          <IconBtn label="Modifier" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></IconBtn>
                          <IconBtn label="Supprimer" danger onClick={() => onDelete(p)}><Trash2 className="h-4 w-4" /></IconBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{p.id.toUpperCase()}</div>
                {(p.userId || p.channelId) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.userId && userName(p.userId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{userName(p.userId)}</span>}
                    {p.channelId && channelName(p.channelId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-status-new-bg text-status-new-fg">{channelName(p.channelId)}</span>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{formatXOF(p.price)}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">Coût {formatXOF(p.cost)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <Pill label="Marge" value={formatXOF(p.price - p.cost)} tone={p.price - p.cost > 0 ? "good" : "neutral"} />
              <Pill label="Stock" value={String(p.stock)} tone={p.stock < 20 ? "bad" : "neutral"} />
              <button onClick={() => onDelete(p)} className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border text-status-cancelled-fg text-xs hover:bg-status-cancelled-bg">
                <Trash2 className="h-3.5 w-3.5" />
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>

      <NewProductModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

const cellInput = "h-8 px-2 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40 w-full";

function IconBtn({ children, onClick, label, danger = false }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-md border border-border transition ${danger ? "text-status-cancelled-fg hover:bg-status-cancelled-bg" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
      {children}
    </button>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "neutral" }) {
  const cls = tone === "good" ? "bg-status-confirmed-bg text-status-confirmed-fg" : tone === "bad" ? "bg-status-cancelled-bg text-status-cancelled-fg" : "bg-muted text-muted-foreground";
  return (
    <div className={`rounded-md px-2 py-1.5 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-xs font-medium tabular-nums">{value}</div>
    </div>
  );
}
