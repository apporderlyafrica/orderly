import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { DEFAULT_SETTINGS, DEFAULT_SHEET_SYNC, deliveryFeeFor, type Channel, type DeliveryZone, type Order, type OrderStatus, type Product, type Settings, type SheetSyncSettings, type User } from "./store-data";
import type { SheetRow } from "./sheets.functions";

const db = supabaseAdmin as any;
const statusSchema = z.enum(["new", "callback", "confirmed", "in_transit", "delivered", "cancelled"]);
const productInput = z.object({ name: z.string().min(2).max(80), price: z.number().int().min(0), cost: z.number().int().min(0), stock: z.number().int().min(0), userId: z.string().optional(), channelId: z.string().optional() });
const orderInput = z.object({ customer: z.string().min(1).max(80), phone: z.string().min(3).max(30), productId: z.string().min(1), city: z.string().min(1).max(80), upsellIds: z.array(z.string()).optional(), deliveryZone: z.enum(["banlieue", "hors_banlieue", "region"]).optional(), paid: z.boolean().optional(), userId: z.string().optional(), channelId: z.string().optional(), clientEmail: z.string().optional() });
const settingsInput = z.object({ closingFee: z.number().int().min(0).optional(), deliveryFeeBanlieue: z.number().int().min(0).optional(), deliveryFeeHorsBanlieue: z.number().int().min(0).optional(), deliveryFeeRegion: z.number().int().min(0).optional() });
const sheetSyncInput = z.object({ url: z.string(), sheetTitle: z.string(), hasHeader: z.boolean(), mapping: z.object({ nom: z.string(), telephone: z.string(), produit: z.string(), ville: z.string(), upsells: z.string() }), auto: z.boolean() });

function mapProduct(r: any): Product { return { id: r.id, name: r.name, price: r.price ?? 0, cost: r.cost ?? 0, stock: r.stock ?? 0, userId: r.user_id || undefined, channelId: r.channel_id || undefined }; }
function mapOrder(r: any): Order { return { id: Number(r.id), date: r.date, customer: r.customer, phone: r.phone, productId: r.product_id, productName: r.product_name || undefined, upsellIds: r.upsell_ids ?? [], upsellNames: r.upsell_names ?? [], city: r.city, deliveryZone: r.delivery_zone || undefined, paid: !!r.paid, userId: r.user_id || undefined, channelId: r.channel_id || undefined, clientEmail: r.client_email || undefined, status: r.status, saleTotal: r.sale_total ?? 0, goodsCostTotal: r.goods_cost_total ?? 0, closingFee: r.closing_fee ?? 0, deliveryFee: r.delivery_fee ?? 0, netAfterFees: r.net_after_fees ?? 0 }; }
function mapUser(r: any): User { return { id: r.id, name: r.name }; }
function mapChannel(r: any): Channel { return { id: r.id, name: r.name }; }
function slugId(name: string) { return `p-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "produit"}-${Date.now().toString(36)}`; }
function entityId(prefix: string, name: string) { return `${prefix}-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item"}`; }
function normalize(s: string) { return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

async function getSettings(): Promise<Settings> {
  const { data } = await db.from("app_settings").select("value").eq("key", "financial").maybeSingle();
  return { ...DEFAULT_SETTINGS, ...((data?.value ?? {}) as Partial<Settings>) };
}

async function getSheetSync(): Promise<SheetSyncSettings> {
  const { data } = await db.from("app_settings").select("value").eq("key", "sheet_sync").maybeSingle();
  return { ...DEFAULT_SHEET_SYNC, ...((data?.value ?? {}) as Partial<SheetSyncSettings>) };
}

async function activeProducts(): Promise<Product[]> {
  const { data, error } = await db.from("products").select("id,name,price,cost,stock").is("deleted_at", null).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

function totals(product: Product | undefined, upsells: Product[], city: string, settings: Settings, status: OrderStatus, zone?: DeliveryZone) {
  const saleTotal = (product?.price ?? 0) + upsells.reduce((s, p) => s + p.price, 0);
  const goodsCostTotal = (product?.cost ?? 0) + upsells.reduce((s, p) => s + p.cost, 0);
  const closingFee = status === "confirmed" || status === "in_transit" || status === "delivered" ? settings.closingFee : 0;
  const deliveryFee = status === "delivered" ? deliveryFeeFor(city, settings, zone) : 0;
  const netAfterFees = status === "delivered" ? saleTotal - closingFee - deliveryFee - goodsCostTotal : 0;
  return { saleTotal, goodsCostTotal, closingFee, deliveryFee, netAfterFees };
}

async function recalcOrder(id: number) {
  const settings = await getSettings();
  const { data: o, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !o) return;
  const products = await activeProducts();
  const main = products.find((p) => p.id === o.product_id);
  const upsells = products.filter((p) => (o.upsell_ids ?? []).includes(p.id));
  const t = totals(main, upsells, o.city, settings, o.status, o.delivery_zone || undefined);
  await db.from("orders").update({ sale_total: t.saleTotal, goods_cost_total: t.goodsCostTotal, closing_fee: t.closingFee, delivery_fee: t.deliveryFee, net_after_fees: t.netAfterFees, product_name: main?.name ?? o.product_name, upsell_names: upsells.map((p) => p.name) }).eq("id", id);
}

export const loadAppData = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ role: z.string().optional(), merchantId: z.string().optional(), clientId: z.string().optional(), email: z.string().optional() }).optional().parse(i ?? undefined))
  .handler(async ({ data }) => {
    const role = data?.role;
    const merchantId = data?.merchantId;
    const clientId = data?.clientId;
    const email = data?.email;

    let ordersQuery = db.from("orders").select("*").is("deleted_at", null);
    if (role === "merchant" && merchantId) ordersQuery = ordersQuery.eq("user_id", merchantId);
    if (role === "client") {
      if (clientId) ordersQuery = ordersQuery.eq("client_id", clientId);
      else if (email) ordersQuery = ordersQuery.eq("client_email", email);
    }
    ordersQuery = ordersQuery.order("date", { ascending: false }).limit(5000);

    const [settings, sheetSync, productsRes, ordersRes, usersRes, channelsRes] = await Promise.all([
      getSettings(),
      getSheetSync(),
      db.from("products").select("id,name,price,cost,stock,user_id,channel_id").is("deleted_at", null).order("created_at", { ascending: true }),
      ordersQuery,
      db.from("users").select("id,name").order("name", { ascending: true }),
      db.from("channels").select("id,name").order("name", { ascending: true }),
    ]);
    if (productsRes.error) throw new Error(productsRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    return { settings, sheetSync, products: (productsRes.data ?? []).map(mapProduct), orders: (ordersRes.data ?? []).map(mapOrder), users: (usersRes.data ?? []).map(mapUser), channels: (channelsRes.data ?? []).map(mapChannel) };
  });

export const saveSheetSync = createServerFn({ method: "POST" }).inputValidator((i: unknown) => sheetSyncInput.parse(i)).handler(async ({ data }) => {
  const { error } = await db.from("app_settings").upsert({ key: "sheet_sync", value: data });
  if (error) throw new Error(error.message);
  return { sheetSync: data };
});

export const saveSettings = createServerFn({ method: "POST" }).inputValidator((i: unknown) => settingsInput.parse(i)).handler(async ({ data }) => {
  const settings = { ...(await getSettings()), ...data };
  const { error } = await db.from("app_settings").upsert({ key: "financial", value: settings });
  if (error) throw new Error(error.message);
  const { data: delivered } = await db.from("orders").select("id").in("status", ["confirmed", "in_transit", "delivered"]).is("deleted_at", null).limit(5000);
  await Promise.all((delivered ?? []).map((o: any) => recalcOrder(Number(o.id))));
  return { settings };
});

export const createProduct = createServerFn({ method: "POST" }).inputValidator((i: unknown) => productInput.parse(i)).handler(async ({ data }) => {
  const product: Product = { id: slugId(data.name), name: data.name, price: data.price, cost: data.cost, stock: data.stock, userId: data.userId, channelId: data.channelId };
  const { error } = await db.from("products").insert({ id: product.id, name: product.name, price: product.price, cost: product.cost, stock: product.stock, user_id: data.userId ?? null, channel_id: data.channelId ?? null });
  if (error) throw new Error(error.message);
  return { product };
});

export const patchProduct = createServerFn({ method: "POST" }).inputValidator((i: unknown) => z.object({ id: z.string(), patch: productInput.partial() }).parse(i)).handler(async ({ data }) => {
  const { error } = await db.from("products").update(data.patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  const { data: affected } = await db.from("orders").select("id").or(`product_id.eq.${data.id},upsell_ids.cs.{${data.id}}`).is("deleted_at", null).limit(5000);
  await Promise.all((affected ?? []).map((o: any) => recalcOrder(Number(o.id))));
  return { ok: true };
});

export const removeProduct = createServerFn({ method: "POST" }).inputValidator((i: unknown) => z.object({ id: z.string() }).parse(i)).handler(async ({ data }) => {
  const { error } = await db.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const createOrder = createServerFn({ method: "POST" }).inputValidator((i: unknown) => orderInput.parse(i)).handler(async ({ data }) => {
  const settings = await getSettings();
  const products = await activeProducts();
  const main = products.find((p) => p.id === data.productId);
  const upsells = products.filter((p) => (data.upsellIds ?? []).includes(p.id));
  const t = totals(main, upsells, data.city, settings, "new", data.deliveryZone);
  const { data: row, error } = await db.from("orders").insert({ customer: data.customer, phone: data.phone, product_id: data.productId, product_name: main?.name ?? "", upsell_ids: upsells.map((p) => p.id), upsell_names: upsells.map((p) => p.name), city: data.city, delivery_zone: data.deliveryZone ?? null, paid: data.paid ?? false, user_id: data.userId ?? null, channel_id: data.channelId ?? null, client_email: data.clientEmail ?? null, status: "new", sale_total: t.saleTotal, goods_cost_total: t.goodsCostTotal, closing_fee: t.closingFee, delivery_fee: t.deliveryFee, net_after_fees: t.netAfterFees }).select("*").single();
  if (error) throw new Error(error.message);
  return { order: mapOrder(row) };
});

export const setOrderStatus = createServerFn({ method: "POST" }).inputValidator((i: unknown) => z.object({ id: z.number(), status: statusSchema }).parse(i)).handler(async ({ data }) => {
  const { error } = await db.from("orders").update({ status: data.status }).eq("id", data.id);
  if (error) throw new Error(error.message);
  await recalcOrder(data.id);
  return { ok: true };
});

export const removeOrders = createServerFn({ method: "POST" }).inputValidator((i: unknown) => z.object({ ids: z.array(z.number()).min(1) }).parse(i)).handler(async ({ data }) => {
  const { error } = await db.from("orders").update({ deleted_at: new Date().toISOString() }).in("id", data.ids);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const importRows = createServerFn({ method: "POST" }).inputValidator((i: unknown) => z.object({ spreadsheetId: z.string(), rows: z.array(z.any()) }).parse(i) as { spreadsheetId: string; rows: SheetRow[] }).handler(async ({ data }) => {
  const settings = await getSettings();
  let products = await activeProducts();
  const ensureProduct = async (name: string) => {
    const found = products.find((p) => normalize(p.name) === normalize(name));
    if (found) return found;
    const created: Product = { id: slugId(name), name, price: 0, cost: 0, stock: 0 };
    const { error } = await db.from("products").insert(created);
    if (error) throw new Error(error.message);
    products = [...products, created];
    return created;
  };
  let added = 0, skipped = 0;
  for (const r of data.rows) {
    const sourceKey = `${data.spreadsheetId}:row-${r.rowIndex}`;
    const { data: exists } = await db.from("orders").select("id").eq("source_key", sourceKey).maybeSingle();
    if (exists) { skipped++; continue; }
    const main = await ensureProduct(r.produit);
    const upsells = [] as Product[];
    for (const name of r.upsells ?? []) {
      const p = await ensureProduct(name);
      if (p.id !== main.id) upsells.push(p);
    }
    const t = totals(main, upsells, r.ville, settings, "new");
    const { error } = await db.from("orders").insert({ customer: r.nom, phone: r.telephone, product_id: main.id, product_name: main.name, upsell_ids: upsells.map((p) => p.id), upsell_names: upsells.map((p) => p.name), city: r.ville, status: "new", source_key: sourceKey, source_spreadsheet_id: data.spreadsheetId, source_row_index: r.rowIndex, sale_total: t.saleTotal, goods_cost_total: t.goodsCostTotal, closing_fee: t.closingFee, delivery_fee: t.deliveryFee, net_after_fees: t.netAfterFees });
    if (error && String(error.message).includes("duplicate")) skipped++; else if (error) throw new Error(error.message); else added++;
  }
  return { added, skipped };
});

const nameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export const addUser = createServerFn({ method: "POST" }).inputValidator((i: unknown) => nameSchema.parse(i)).handler(async ({ data }) => {
  const id = entityId("u", data.name);
  const existing = await db.from("users").select("id,name").eq("id", id).maybeSingle();
  if (existing.data) return { user: mapUser(existing.data) };
  const { error } = await db.from("users").insert({ id, name: data.name });
  if (error) throw new Error(error.message);
  return { user: { id, name: data.name } };
});

export const addChannel = createServerFn({ method: "POST" }).inputValidator((i: unknown) => nameSchema.parse(i)).handler(async ({ data }) => {
  const id = entityId("c", data.name);
  const existing = await db.from("channels").select("id,name").eq("id", id).maybeSingle();
  if (existing.data) return { channel: mapChannel(existing.data) };
  const { error } = await db.from("channels").insert({ id, name: data.name });
  if (error) throw new Error(error.message);
  return { channel: { id, name: data.name } };
});

const teamMemberSchema = z.object({ email: z.string().email().optional(), name: z.string().trim().min(1).max(60), role: z.enum(["owner", "member", "merchant", "client"]), merchantId: z.string().optional() });

export const addTeamMember = createServerFn({ method: "POST" }).inputValidator((i: unknown) => teamMemberSchema.parse(i)).handler(async ({ data }) => {
  const id = `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const rec = { id, email: data.email ?? null, name: data.name, role: data.role, merchant_id: data.merchantId ?? null };
  const { error } = await db.from("workspace_members").insert(rec);
  if (error) throw new Error(error.message);
  return { member: { id, email: data.email, name: data.name, role: data.role, merchantId: data.merchantId } };
});

export const listTeamMembers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db.from("workspace_members").select("id,email,name,role,merchant_id").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { members: (data ?? []).map((r: any) => ({ id: r.id, email: r.email, name: r.name, role: r.role, merchantId: r.merchant_id })) };
});