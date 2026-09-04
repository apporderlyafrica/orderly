import { X, Phone, MapPin, UserRound, Radio, Package, Truck, Wallet, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_BADGE, STATUS_LABELS, ZONE_LABELS, getDeliveryZone, type Order } from "@/lib/store-data";
import { formatXOF, telHref } from "@/lib/format";

export function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { productById, settings, users, channels } = useStore();
  if (!order) return null;

  const p = productById(order.productId);
  const upsells = (order.upsellIds ?? []).map(productById).filter(Boolean) as { id: string; name: string; price: number }[];
  const zone = order.deliveryZone ?? getDeliveryZone(order.city);
  const merchant = users.find((u) => u.id === order.userId)?.name;
  const channel = channels.find((c) => c.id === order.channelId)?.name;

  const sale = order.saleTotal ?? p?.price ?? 0;
  const cogs = order.goodsCostTotal ?? p?.cost ?? 0;
  const closing = order.closingFee ?? 0;
  const delivery = order.deliveryFee ?? 0;
  const net = order.netAfterFees ?? (order.status === "delivered" ? sale - closing - delivery - cogs : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-xl shadow-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 h-14 border-b border-border sticky top-0 bg-surface">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[order.status]}`}>{STATUS_LABELS[order.status]}</span>
            <span className="text-xs text-muted-foreground">#{order.id}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5">
          {/* Client */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold">{order.customer}</div>
              <div className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <a href={telHref(order.phone)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-status-confirmed-bg text-status-confirmed-fg text-sm font-medium">
              <Phone className="h-4 w-4" /> {order.phone}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Info icon={MapPin} label="Livraison" value={`${order.city || "—"} · ${ZONE_LABELS[zone]}`} />
            <Info icon={UserRound} label="Commerçant" value={merchant ?? "—"} />
            <Info icon={Radio} label="Canal" value={channel ?? "—"} />
            <Info icon={Truck} label="Fraix" value={formatXOF(delivery)} />
          </div>

          {/* Produits */}
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Produits</h3>
            <div className="space-y-2">
              <Row name={p?.name ?? order.productName ?? "Produit"} qty={1} price={p?.price ?? 0} cost={p?.cost ?? 0} />
              {upsells.map((u, i) => (
                <Row key={u.id} name={u.name} qty={1} price={u.price} cost={productById(u.id)?.cost ?? 0} />
              ))}
            </div>
          </div>

          {/* Comptabilité */}
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Comptabilité</h3>
            <div className="rounded-xl border border-border divide-y divide-border">
              <MoneyRow icon={Wallet} label="Chiffre d'affaires" value={sale} />
              <MoneyRow icon={Package} label="Coût marchandise" value={-cogs} muted />
              <MoneyRow icon={Wallet} label="Closing" value={-closing} muted />
              <MoneyRow icon={Truck} label="Livraison" value={-delivery} muted />
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-foreground" /> Bénéfice net</span>
                <span className="text-base font-bold tabular-nums text-status-delivered-fg">{formatXOF(net)}</span>
              </div>
            </div>
          </div>

          {order.paid ? (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-status-delivered-bg px-3 py-1 text-xs font-medium text-status-delivered-fg">Payée</div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">À payer</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</div>
      <div className="text-sm font-medium truncate mt-0.5">{value}</div>
    </div>
  );
}

function Row({ name, qty, price, cost }: { name: string; qty: number; price: number; cost: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground">Coût {formatXOF(cost)}</div>
      </div>
      <span className="text-sm font-semibold tabular-nums shrink-0">{formatXOF(price)}</span>
    </div>
  );
}

function MoneyRow({ icon: Icon, label, value, muted = false }: { icon: any; label: string; value: number; muted?: boolean }) {
  const sign = value < 0 ? "− " : "";
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className={`flex items-center gap-2 text-sm ${muted ? "text-muted-foreground" : "font-medium"}`}><Icon className="h-4 w-4" /> {label}</span>
      <span className={`text-sm font-medium tabular-nums ${muted ? "text-muted-foreground" : ""}`}>{sign}{formatXOF(Math.abs(value))}</span>
    </div>
  );
}
