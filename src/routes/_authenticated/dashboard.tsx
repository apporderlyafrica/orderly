import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatXOF } from "@/lib/format";
import {
  ShoppingBag, CheckCircle2, Truck, PhoneCall, XCircle,
  TrendingUp, Wallet, Package, Filter, MoveRight,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { deliveryFeeFor, type Order } from "@/lib/store-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Tableau de bord — Orderly" }] }),
});

const PERIODS = [
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trim." },
  { key: "year", label: "Année" },
] as const;
type Period = (typeof PERIODS)[number]["key"];

type Agg = { key: string; label: string; orders: number; revenue: number; profit: number };

function bucketKey(d: Date, period: Period): string {
  if (period === "week") {
    const wd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return wd.toISOString().slice(0, 10);
  }
  if (period === "month") return `${d.getFullYear()}-${d.getMonth()}`;
  if (period === "quarter") return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  return `${d.getFullYear()}`;
}

function buildBuckets(period: Period): Agg[] {
  const now = new Date();
  const count = period === "week" ? 8 : period === "month" ? 8 : period === "quarter" ? 5 : 4;
  const out: Agg[] = [];
  for (let i = count - 1; i >= 0; i--) {
    let key = "";
    let label = "";
    if (period === "week") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
      key = d.toISOString().slice(0, 10);
      label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } else if (period === "month") {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      key = `${d.getFullYear()}-${d.getMonth()}`;
      label = d.toLocaleDateString("fr-FR", { month: "short" });
    } else if (period === "quarter") {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
      key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      label = `T${Math.floor(d.getMonth() / 3) + 1}`;
    } else {
      const d = new Date(now.getFullYear() - i, 0, 1);
      key = String(d.getFullYear());
      label = String(d.getFullYear());
    }
    out.push({ key, label, orders: 0, revenue: 0, profit: 0 });
  }
  return out;
}

function aggregateOrders(orders: Order[], period: Period): Agg[] {
  const buckets = buildBuckets(period);
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const o of orders) {
    const d = new Date(o.date);
    if (isNaN(d.getTime())) continue;
    const b = map.get(bucketKey(d, period));
    if (!b) continue;
    b.orders++;
    if (o.status === "delivered") {
      b.revenue += o.saleTotal ?? 0;
      b.profit += o.netAfterFees ?? 0;
    }
  }
  return [...map.values()];
}

function orderRevenue(o: Order, priceOf: (id: string) => number): number {
  return priceOf(o.productId) + (o.upsellIds ?? []).reduce((s, id) => s + priceOf(id), 0);
}
function orderCogs(o: Order, costOf: (id: string) => number): number {
  return costOf(o.productId) + (o.upsellIds ?? []).reduce((s, id) => s + costOf(id), 0);
}

function Dashboard() {
  const { orders, products, productById, settings } = useStore();
  const { user } = useAuth();
  const meta = ((user as any)?.user_metadata ?? {}) as { role?: string; orgName?: string };

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("month");

  const filteredOrders = useMemo(() => {
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return orders.filter((o) => {
      const t = new Date(o.date).getTime();
      if (t < fromTs || t > toTs) return false;
      if (productFilter !== "all") {
        const has = o.productId === productFilter || (o.upsellIds ?? []).includes(productFilter);
        if (!has) return false;
      }
      return true;
    });
  }, [orders, from, to, productFilter]);

  const chartData = useMemo(() => aggregateOrders(filteredOrders, period), [filteredOrders, period]);

  const priceOf = (id: string) => productById(id)?.price ?? 0;
  const costOf = (id: string) => productById(id)?.cost ?? 0;

  const total = filteredOrders.length;
  const byStatus = {
    new: filteredOrders.filter((o) => o.status === "new").length,
    callback: filteredOrders.filter((o) => o.status === "callback").length,
    confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
    in_transit: filteredOrders.filter((o) => o.status === "in_transit").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
    cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
  };

  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");
  const revenue = deliveredOrders.reduce((s, o) => s + orderRevenue(o, priceOf), 0);
  const closingCount = byStatus.confirmed + byStatus.in_transit + byStatus.delivered;
  const closingTotal = closingCount * settings.closingFee;
  const deliveryTotal = deliveredOrders.reduce((s, o) => s + deliveryFeeFor(o.city, settings, o.deliveryZone), 0);
  const goodsCost = deliveredOrders.reduce((s, o) => s + orderCogs(o, costOf), 0);
  const netProfit = revenue - closingTotal - deliveryTotal - goodsCost;
  const confirmRate = total ? Math.round(((byStatus.confirmed + byStatus.in_transit + byStatus.delivered) / total) * 100) : 0;
  const deliveredRate = total ? Math.round((byStatus.delivered / total) * 100) : 0;

  const chartRevenueTotal = chartData.reduce((s, b) => s + b.revenue, 0);
  const avgPerPeriod = chartData.length ? Math.round(chartRevenueTotal / chartData.length) : 0;

  const counts = new Map<string, number>();
  filteredOrders.forEach((o) => {
    counts.set(o.productId, (counts.get(o.productId) ?? 0) + 1);
    (o.upsellIds ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });
  const best = [...counts.entries()]
    .map(([id, c]) => ({ product: productById(id), count: c }))
    .filter((x) => x.product)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxCount = Math.max(1, ...best.map((b) => b.count));

  const hasFilter = from || to || productFilter !== "all";

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-7xl">
      <header className="mb-6 sm:mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {meta.orgName || "Mon espace"} · {meta.role === "client" ? "Client" : meta.role === "merchant" ? "Commerçant" : "Équipe"}
        </div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.24em]">Performance globale</p>
        <div className="mt-3 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight tabular-nums">{formatXOF(revenue)}</div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-status-delivered-bg px-2.5 py-1 font-medium text-status-delivered-fg">
            <TrendingUp className="h-3.5 w-3.5" />
            Chiffre d'affaires
          </span>
          <span className="text-muted-foreground">{byStatus.delivered} commande{byStatus.delivered > 1 ? "s" : ""} livrée{byStatus.delivered > 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* Bande KPI : carrousel horizontal (une ligne, swipe mobile, Bénéfice net en tête) */}
      <section className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        <KpiTile icon={TrendingUp} label="Bénéfice net" value={formatXOF(netProfit)} hint={`Marge ${revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0}%`} highlight />
        <KpiTile icon={TrendingUp} label="Chiffre d'affaires" value={formatXOF(revenue)} hint={`${byStatus.delivered} livrée(s)`} />
        <KpiTile icon={Wallet} label="Frais closing" value={formatXOF(closingTotal)} hint={`${closingCount} × ${formatXOF(settings.closingFee)}`} />
        <KpiTile icon={Truck} label="Frais livraison" value={formatXOF(deliveryTotal)} hint={`Moy. ${formatXOF(avgPerPeriod)}`} />
        <KpiTile icon={CheckCircle2} label="Taux de clôture" value={`${confirmRate}%`} hint={`${byStatus.confirmed + byStatus.in_transit + byStatus.delivered} clôturées`} />
        <KpiTile icon={ShoppingBag} label="Reçues" value={total} hint="Toutes commandes" />
        <KpiTile icon={PhoneCall} label="À rappeler" value={byStatus.callback} hint="En attente" tone="callback" />
        <KpiTile icon={CheckCircle2} label="Confirmées" value={byStatus.confirmed} hint="Closing payé" tone="confirmed" />
        <KpiTile icon={MoveRight} label="En cours" value={byStatus.in_transit} hint="En livraison" tone="confirmed" />
        <KpiTile icon={Truck} label="Livrées" value={byStatus.delivered} hint="Encaissées" tone="delivered" />
        <KpiTile icon={XCircle} label="Annulées" value={byStatus.cancelled} hint="Perdues" tone="cancelled" />
      </section>

      {/* Toolbar : filtres + période */}
      <section className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <DateField label="Du" value={from} onChange={setFrom} />
          <DateField label="Au" value={to} onChange={setTo} />
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Produit</span>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40">
              <option value="all">Tous les produits</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>
        {hasFilter && (
          <button onClick={() => { setFrom(""); setTo(""); setProductFilter("all"); }} className="h-10 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground shrink-0">Réinitialiser</button>
        )}
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shrink-0">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`h-8 px-3 rounded-md text-xs font-medium transition ${period === p.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grande courbe */}
      <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold">Activit<span className="text-muted-foreground">é</span></h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {chartRevenueTotal > 0 ? formatXOF(chartRevenueTotal) : "—"} encaissé · <span className="tabular-nums">{chartData.reduce((s, b) => s + b.orders, 0)}</span> commandes
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" /> Revenu</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-foreground/10" /> Commandes</span>
          </div>
        </div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="6%" stopColor="#0e1e38" stopOpacity={0.14} />
                  <stop offset="98%" stopColor="#0e1e38" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ecece6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9a9a92" }} tickMargin={8} />
              <YAxis yAxisId="rev" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9a9a92" }} width={52} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : `${v}`} />
              <YAxis yAxisId="orders" orientation="left" hide />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(14,30,56,0.04)" }} />
              <Bar yAxisId="orders" dataKey="orders" barSize={8} fill="rgba(14,30,56,0.10)" radius={[2, 2, 0, 0]} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="none" fill="url(#revFill)" />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" stroke="#0e1e38" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#75fb90", stroke: "#fff", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Bottom grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Meilleures ventes
          </h2>
          <ul className="space-y-3">
            {best.length === 0 && <p className="text-xs text-muted-foreground">Aucune vente sur cette période.</p>}
            {best.map(({ product, count }) => (
              <li key={product!.id} className="flex items-center gap-3 sm:gap-4">
                <span className="text-sm text-foreground w-28 sm:w-44 truncate">{product!.name}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-14 sm:w-16 text-right tabular-nums">{count} cmd.</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold mb-1">Insight</h2>
          <p className="text-xs text-muted-foreground mb-4">Part des commandes livrées sur la période.</p>
          <Donut pct={deliveredRate} />
          <div className="mt-3 flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-xl font-bold tabular-nums">{byStatus.delivered}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Livrées</div>
            </div>
            <div>
              <div className="text-xl font-bold tabular-nums">{total - byStatus.delivered}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Reste</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 mt-4">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Inventaire
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-md bg-muted/40">
              <span className="truncate">{p.name}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">{p.stock}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload as Agg;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-xl">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label} · {d.orders} cmd.</div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums">{formatXOF(d.revenue)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-status-delivered-bg px-1.5 py-0.5 text-[10px] font-medium text-status-delivered-fg">CA</span>
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 56;
  const c = Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <svg viewBox="0 0 140 80" className="mx-auto w-full max-w-[190px]">
      <path d="M14 70 A56 56 0 0 1 126 70" fill="none" stroke="var(--border)" strokeWidth="14" strokeLinecap="round" />
      <path d="M14 70 A56 56 0 0 1 126 70" fill="none" stroke="#75fb90" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={offset} />
      <text x="70" y="62" textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="700">{pct}%</text>
    </svg>
  );
}

const toneClass: Record<string, string> = {
  callback: "text-status-callback-fg",
  confirmed: "text-status-confirmed-fg",
  in_transit: "text-status-confirmed-fg",
  delivered: "text-status-delivered-fg",
  cancelled: "text-status-cancelled-fg",
  default: "text-foreground",
};

function KpiTile({ icon: Icon, label, value, hint, tone, highlight = false }: { icon: any; label: string; value: number | string; hint: string; tone?: string; highlight?: boolean }) {
  const toneCls = tone ? toneClass[tone] : "text-foreground";
  return (
    <div className={`snap-start flex-none w-40 flex flex-col justify-between rounded-xl border px-3 py-2.5 min-h-[82px] ${highlight ? "bg-primary text-primary-foreground border-primary shadow-[0_6px_20px_-8px_rgba(117,251,144,0.7)]" : "bg-surface border-border"}`}>
      <div className="flex items-center justify-between gap-1.5">
        <span className={`text-[11px] uppercase tracking-wide font-medium truncate ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${highlight ? "opacity-80" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-1.5 text-xl font-bold tabular-nums tracking-tight truncate ${highlight ? "" : toneCls}`}>{value}</div>
      <div className={`text-[11px] mt-0.5 truncate ${highlight ? "opacity-80" : "text-muted-foreground"}`}>{hint}</div>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40"
      />
    </label>
  );
}
