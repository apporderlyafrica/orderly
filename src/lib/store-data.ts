export type OrderStatus = "new" | "callback" | "confirmed" | "in_transit" | "delivered" | "cancelled";

export type User = { id: string; name: string };
export type Channel = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  userId?: string;
  channelId?: string;
};

export type Order = {
  id: number;
  date: string; // ISO
  customer: string;
  phone: string;
  productId: string;
  productName?: string;
  upsellIds?: string[];
  upsellNames?: string[];
  city: string;
  deliveryZone?: DeliveryZone;
  paid?: boolean;
  userId?: string;
  channelId?: string;
  status: OrderStatus;
  saleTotal?: number;
  goodsCostTotal?: number;
  closingFee?: number;
  deliveryFee?: number;
  netAfterFees?: number;
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nouvelle",
  callback: "À rappeler",
  confirmed: "Confirmée",
  in_transit: "En cours",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const STATUS_ORDER: OrderStatus[] = ["new", "callback", "confirmed", "in_transit", "delivered", "cancelled"];

export const STATUS_BADGE: Record<OrderStatus, string> = {
  new: "bg-status-new-bg text-status-new-fg",
  callback: "bg-status-callback-bg text-status-callback-fg",
  confirmed: "bg-status-confirmed-bg text-status-confirmed-fg",
  in_transit: "bg-status-confirmed-bg text-status-confirmed-fg",
  delivered: "bg-status-delivered-bg text-status-delivered-fg",
  cancelled: "bg-status-cancelled-bg text-status-cancelled-fg",
};

export const INITIAL_PRODUCTS: Product[] = [];

const customers = [
  ["Awa Diop", "77 123 45 67", "Dakar"],
  ["Moussa Ndiaye", "78 234 56 78", "Thiès"],
  ["Fatou Sarr", "76 345 67 89", "Saint-Louis"],
  ["Cheikh Fall", "70 456 78 90", "Touba"],
  ["Aminata Ba", "75 567 89 01", "Mbour"],
  ["Ibrahima Sow", "77 678 90 12", "Rufisque"],
  ["Ndeye Gueye", "78 789 01 23", "Kaolack"],
  ["Mamadou Cissé", "76 890 12 34", "Ziguinchor"],
  ["Aïssatou Diallo", "70 901 23 45", "Diourbel"],
  ["Ousmane Faye", "77 012 34 56", "Louga"],
];

const statuses: OrderStatus[] = [
  "new", "callback", "confirmed", "delivered", "delivered",
  "cancelled", "new", "confirmed", "delivered", "callback",
];

export function buildInitialOrders(): Order[] {
  return [];
}

// ─── Zones de livraison ────────────────────────────────────────────────
export type DeliveryZone = "banlieue" | "hors_banlieue" | "region";

export const ZONE_LABELS: Record<DeliveryZone, string> = {
  banlieue: "Dakar & Banlieue",
  hors_banlieue: "Hors banlieue",
  region: "Régions",
};

export const DELIVERY_ZONES: DeliveryZone[] = ["banlieue", "hors_banlieue", "region"];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Dakar + grande banlieue (2000F)
const BANLIEUE = [
  "dakar", "pikine", "guediawaye", "parcelles assainies", "yoff", "ouakam",
  "ngor", "mermoz", "sacre coeur", "liberte", "medina", "plateau", "fann",
  "almadies", "point e", "hann", "grand yoff", "grand dakar", "hlm",
  "thiaroye", "guinaw rails", "rufisque",
];

// Hors banlieue (3000F) — périphérie Dakar / Thiès proche
const HORS_BANLIEUE = [
  "bargny", "diamniadio", "sebikotane", "sangalkam", "keur massar",
  "yene", "sindia", "popenguine", "saly", "somone",
];

export function getDeliveryZone(city: string): DeliveryZone {
  const c = norm(city);
  if (!c) return "region";
  if (BANLIEUE.some((x) => c.includes(x))) return "banlieue";
  if (HORS_BANLIEUE.some((x) => c.includes(x))) return "hors_banlieue";
  return "region";
}

export type Settings = {
  closingFee: number;            // FCFA par commande confirmée OU livrée
  deliveryFeeBanlieue: number;   // FCFA — Dakar & banlieue
  deliveryFeeHorsBanlieue: number; // FCFA — hors banlieue
  deliveryFeeRegion: number;     // FCFA — régions
};

export const DEFAULT_SETTINGS: Settings = {
  closingFee: 1000,
  deliveryFeeBanlieue: 2000,
  deliveryFeeHorsBanlieue: 3000,
  deliveryFeeRegion: 4000,
};

export function deliveryFeeFor(city: string, s: Settings, zone?: DeliveryZone): number {
  const z = zone ?? getDeliveryZone(city);
  if (z === "banlieue") return s.deliveryFeeBanlieue;
  if (z === "hors_banlieue") return s.deliveryFeeHorsBanlieue;
  return s.deliveryFeeRegion;
}

export type SheetSyncMapping = { nom: string; telephone: string; produit: string; ville: string; upsells: string };

export type SheetSyncSettings = {
  url: string;
  sheetTitle: string;
  hasHeader: boolean;
  mapping: SheetSyncMapping;
  auto: boolean;
};

export const DEFAULT_SHEET_SYNC: SheetSyncSettings = {
  url: "",
  sheetTitle: "",
  hasHeader: false,
  mapping: { nom: "A", telephone: "B", ville: "C", produit: "F", upsells: "" },
  auto: true,
};
