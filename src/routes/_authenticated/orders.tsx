import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Phone, Trash2, Filter, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { STATUS_BADGE, STATUS_LABELS, STATUS_ORDER, ZONE_LABELS, getDeliveryZone, deliveryFeeFor, type OrderStatus } from "@/lib/store-data";
import { telHref, formatXOF } from "@/lib/format";
import { OrderDetailModal } from "@/components/OrderDetailModal";
import type { Order } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Commandes — Orderly" }] }),
});

function OrdersPage() {
  const { orders, products, productById, updateStatus, deleteOrder, deleteOrders, settings, users, channels } = useStore();
  const { user } = useAuth();
  const role = ((user as any)?.user_metadata ?? {}).role;
  const isReadOnly = role === "client" || role === "merchant";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [merchantFilter, setMerchantFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<Order | null>(null);

  const userName = (id?: string) => users.find((u) => u.id === id)?.name;
  const channelName = (id?: string) => channels.find((c) => c.id === id)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      const t = new Date(o.date).getTime();
      if (t < fromTs || t > toTs) return false;
      if (productFilter !== "all" && o.productId !== productFilter && !(o.upsellIds ?? []).includes(productFilter)) return false;
      if (merchantFilter !== "all" && (o.userId ?? "") !== merchantFilter) return false;
      if (channelFilter !== "all" && (o.channelId ?? "") !== channelFilter) return false;
      if (!q) return true;
      return o.customer.toLowerCase().includes(q) || String(o.id).includes(q) || o.phone.includes(q);
    });
  }, [orders, query, filter, from, to, productFilter, merchantFilter, channelFilter]);

  function toggleSel(id: number) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  }
  function confirmTwice(msg: string): boolean {
    if (!window.confirm(msg)) return false;
    return window.confirm("Confirmer la suppression définitive ? Cette action est irréversible.");
  }
  function onDelete(id: number) { if (confirmTwice(`Supprimer la commande #${id} ?`)) deleteOrder(id); }
  function onDeleteBulk() {
    if (selected.size === 0) return;
    if (confirmTwice(`Supprimer ${selected.size} commande(s) ?`)) { deleteOrders([...selected]); setSelected(new Set()); }
  }

  const hasFilters = from || to || productFilter !== "all" || merchantFilter !== "all" || channelFilter !== "all";

  if (isReadOnly) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Suivi</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Mes commandes</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{orders.length} commande{orders.length > 1 ? "s" : ""} — suivez l'état de vos commandes.</p>
        </header>
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">Vous n'avez pas encore de commande.</div>
          )}
          {orders.map((o) => {
            const p = productById(o.productId);
            const upsells = (o.upsellIds ?? []).map(productById).filter(Boolean) as { id: string; name: string; price: number }[];
            const total = (p?.price ?? 0) + upsells.reduce((s, u) => s + u.price, 0);
            const zone = o.deliveryZone ?? getDeliveryZone(o.city);
            return (
              <div key={o.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{o.customer}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">#{o.id} · {new Date(o.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                </div>
                <div className="text-sm text-foreground flex items-center justify-between gap-2 mt-3">
                  <span className="truncate">{p?.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">{p ? formatXOF(p.price) : ""}</span>
                </div>
                {upsells.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {upsells.map((u) => <span key={u.id} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-confirmed-bg text-status-confirmed-fg">+ {u.name}</span>)}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{o.city || "—"} · {ZONE_LABELS[zone]}</span>
                  <span className="tabular-nums font-medium text-foreground">{formatXOF(total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <PayBadge paid={!!o.paid} />
                  <button onClick={() => setDetail(o)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-medium hover:bg-accent"><Eye className="h-3.5 w-3.5" /> Détails</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-7xl">
      <header className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.14em]">Pipeline</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">Commandes</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {filtered.length} affichée{filtered.length > 1 ? "s" : ""} · {orders.length} au total
        </p>
      </header>

      {/* Filtres date + produit */}
      <section className="bg-surface border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Filtres</h2>
          {hasFilters && (
            <button onClick={() => { setFrom(""); setTo(""); setProductFilter("all"); setMerchantFilter("all"); setChannelFilter("all"); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
              Réinitialiser
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Du</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Au</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Commerçant</span>
            <select value={merchantFilter} onChange={(e) => setMerchantFilter(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
              <option value="all">Tous les commerçants</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Canal</span>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
              <option value="all">Tous les canaux</option>
              {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Produit</span>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
              <option value="all">Tous les produits</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher nom, N° ou téléphone…"
            className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Tous</FilterChip>
          {STATUS_ORDER.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 rounded-md bg-foreground text-background text-sm">
          <span>{selected.size} sélectionnée(s)</span>
          <button onClick={onDeleteBulk} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-background/15 hover:bg-background/25 text-xs font-medium">
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </button>
        </div>
      )}

      <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" aria-label="Tout sélectionner" className="h-4 w-4 accent-foreground"
                    checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
                </th>
                <Th>Date</Th><Th>N°</Th><Th>Client</Th><Th>Téléphone</Th><Th>Produit</Th><Th>Adresse</Th><Th>Total</Th><Th>Statut</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">Aucune commande trouvée.</td></tr>
              )}
              {filtered.map((o) => {
                const p = productById(o.productId);
                const upsells = (o.upsellIds ?? []).map(productById).filter(Boolean) as { id: string; name: string; price: number }[];
                const total = (p?.price ?? 0) + upsells.reduce((s, u) => s + u.price, 0);
                const zone = o.deliveryZone ?? getDeliveryZone(o.city);
                const fee = deliveryFeeFor(o.city, settings, o.deliveryZone);
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 align-top">
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Sélectionner ${o.id}`} className="h-4 w-4 accent-foreground"
                        checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} />
                    </td>
                    <Td className="text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(o.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </Td>
                    <Td className="font-medium tabular-nums">#{o.id}</Td>
                    <Td>{o.customer}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {o.userId && userName(o.userId) && (
                          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{userName(o.userId)}</span>
                        )}
                        {o.channelId && channelName(o.channelId) && (
                          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-new-bg text-status-new-fg">{channelName(o.channelId)}</span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{o.phone}</span>
                        <CallButton phone={o.phone} />
                      </div>
                    </Td>
                    <Td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span>{p?.name ?? "—"}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{p ? formatXOF(p.price) : ""}</span>
                        </div>
                        {upsells.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {upsells.map((u) => (
                              <span key={u.id} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-confirmed-bg text-status-confirmed-fg">
                                + {u.name}{u.price > 0 ? ` · ${formatXOF(u.price)}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{o.city}</span>
                        <span className="text-[10px] text-muted-foreground">{ZONE_LABELS[zone]} · {formatXOF(fee)}</span>
                      </div>
                    </Td>
                    <Td className="font-medium tabular-nums whitespace-nowrap">{formatXOF(total)}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                          {STATUS_LABELS[o.status]}
                        </span>
                        <PayBadge paid={!!o.paid} />
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetail(o)} aria-label="Détails" title="Détails"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                          className="h-8 px-2 rounded-md border border-border bg-surface text-xs outline-none focus:border-foreground/40">
                          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                        <button onClick={() => onDelete(o.id)} aria-label="Supprimer" title="Supprimer"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-status-cancelled-fg hover:bg-status-cancelled-bg">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">Aucune commande trouvée.</p>}
        {filtered.map((o) => {
          const p = productById(o.productId);
          const upsells = (o.upsellIds ?? []).map(productById).filter(Boolean) as { id: string; name: string; price: number }[];
          const total = (p?.price ?? 0) + upsells.reduce((s, u) => s + u.price, 0);
          const zone = o.deliveryZone ?? getDeliveryZone(o.city);
          const fee = deliveryFeeFor(o.city, settings, o.deliveryZone);
          return (
            <div key={o.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{o.customer}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    #{o.id} · {new Date(o.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </div>
                  {(o.userId || o.channelId) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {o.userId && userName(o.userId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent text-accent-foreground">{userName(o.userId)}</span>}
                      {o.channelId && channelName(o.channelId) && <span className="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-status-new-bg text-status-new-fg">{channelName(o.channelId)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                  <PayBadge paid={!!o.paid} />
                </div>
              </div>
              <div className="text-sm text-foreground flex items-center justify-between gap-2">
                <span className="truncate">{p?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{p ? formatXOF(p.price) : ""}</span>
              </div>
              {upsells.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {upsells.map((u) => (
                    <span key={u.id} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-status-confirmed-bg text-status-confirmed-fg">
                      + {u.name}{u.price > 0 ? ` · ${formatXOF(u.price)}` : ""}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{o.city} · {ZONE_LABELS[zone]}</span>
                <span className="tabular-nums">Livraison {formatXOF(fee)}</span>
              </div>
              <div className="mt-1 text-sm font-medium tabular-nums">Total : {formatXOF(total)}</div>
              <div className="flex items-center justify-between gap-2 mt-3 mb-3">
                <span className="text-sm text-muted-foreground tabular-nums">{o.phone}</span>
                <CallButton phone={o.phone} large />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDetail(o)} aria-label="Détails"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Eye className="h-4 w-4" />
                </button>
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                  className="flex-1 h-9 px-2 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button onClick={() => onDelete(o.id)} aria-label="Supprimer"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-status-cancelled-fg hover:bg-status-cancelled-bg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <OrderDetailModal order={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function CallButton({ phone, large = false }: { phone: string; large?: boolean }) {
  return (
    <a href={telHref(phone)} aria-label={`Appeler ${phone}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-status-confirmed-bg text-status-confirmed-fg font-medium hover:opacity-90 transition ${large ? "h-9 px-3 text-sm" : "h-7 px-2 text-xs"}`}>
      <Phone className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      Appeler
    </a>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left font-medium px-4 py-3">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
function PayBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-delivered-bg text-status-delivered-fg">Payé</span>
  ) : (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">À payer</span>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 h-9 px-3 rounded-md text-xs font-medium border transition ${active ? "bg-foreground text-background border-foreground" : "bg-surface text-muted-foreground border-border hover:text-foreground"}`}>
      {children}
    </button>
  );
}
