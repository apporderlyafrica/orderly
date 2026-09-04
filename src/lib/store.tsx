import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  addChannel,
  addTeamMember,
  addUser,
  createOrder,
  createProduct,
  importRows,
  listTeamMembers,
  loadAppData,
  patchProduct,
  removeChannel,
  removeOrders,
  removeProduct,
  removeTeamMember,
  removeUser,
  renameChannel,
  renameUser,
  saveSettings,
  saveSheetSync,
  setOrderStatus,
  updateTeamMember,
} from "./store.functions";
import { DEFAULT_SETTINGS, DEFAULT_SHEET_SYNC, type Channel, type DeliveryZone, type Order, type OrderStatus, type Product, type Settings, type SheetSyncSettings, type User } from "./store-data";
import { useAuth } from "./auth";
import { supabase } from "@/integrations/supabase/client";
import type { SheetRow } from "./sheets.functions";

export type TeamMember = { id: string; email?: string; name: string; role: string; merchantId?: string };

type StoreCtx = {
  orders: Order[];
  products: Product[];
  users: User[];
  channels: Channel[];
  teamMembers: TeamMember[];
  settings: Settings;
  sheetSync: SheetSyncSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  updateSheetSync: (s: SheetSyncSettings) => Promise<void>;
  addUser: (name: string) => Promise<User>;
  addChannel: (name: string) => Promise<Channel>;
  addMember: (m: { email?: string; name: string; role: string; merchantId?: string }) => Promise<void>;
  updateMember: (m: TeamMember) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  renameChannel: (id: string, name: string) => Promise<void>;
  removeChannel: (id: string) => Promise<void>;
  renameUser: (id: string, name: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  addOrder: (input: { customer: string; phone: string; productId: string; city: string; upsellIds?: string[]; deliveryZone?: DeliveryZone; paid?: boolean; userId?: string; channelId?: string; clientEmail?: string }) => Promise<void>;
  updateStatus: (id: number, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  deleteOrders: (ids: number[]) => Promise<void>;
  addProduct: (input: { name: string; price: number; cost: number; stock: number; userId?: string; channelId?: string }) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  productById: (id: string) => Product | undefined;
  importedRowKeys: Set<string>;
  importSheetRows: (spreadsheetId: string, rows: SheetRow[]) => Promise<{ added: number; skipped: number }>;
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const loadFn = useServerFn(loadAppData);
  const createOrderFn = useServerFn(createOrder);
  const createProductFn = useServerFn(createProduct);
  const patchProductFn = useServerFn(patchProduct);
  const removeProductFn = useServerFn(removeProduct);
  const removeOrdersFn = useServerFn(removeOrders);
  const setOrderStatusFn = useServerFn(setOrderStatus);
  const saveSettingsFn = useServerFn(saveSettings);
  const saveSheetSyncFn = useServerFn(saveSheetSync);
  const importRowsFn = useServerFn(importRows);
  const addUserFn = useServerFn(addUser);
  const addChannelFn = useServerFn(addChannel);
  const addTeamMemberFn = useServerFn(addTeamMember);
  const listTeamMembersFn = useServerFn(listTeamMembers);
  const updateTeamMemberFn = useServerFn(updateTeamMember);
  const removeTeamMemberFn = useServerFn(removeTeamMember);
  const renameChannelFn = useServerFn(renameChannel);
  const removeChannelFn = useServerFn(removeChannel);
  const renameUserFn = useServerFn(renameUser);
  const removeUserFn = useServerFn(removeUser);
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sheetSync, setSheetSync] = useState<SheetSyncSettings>(DEFAULT_SHEET_SYNC);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const meta = ((user as any)?.user_metadata ?? {}) as { role?: string; merchantId?: string; clientId?: string };
    let role = meta.role;
    let merchantId = meta.merchantId;
    let clientId = meta.clientId;
    try {
      const tm = await listTeamMembersFn();
      setTeamMembers(tm.members ?? []);
      const rec = (tm.members ?? []).find((m) => m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase());
      if (rec) {
        role = rec.role ?? role;
        merchantId = rec.merchantId ?? merchantId;
        if (meta.role !== rec.role || meta.merchantId !== rec.merchantId) {
          supabase.auth.updateUser({ data: { role: rec.role, merchantId: rec.merchantId } }).catch(() => {});
        }
      }
    } catch { setTeamMembers([]); }
    const data = await loadFn({ data: { role, merchantId, clientId, email: user?.email } });
    setOrders(data.orders);
    setProducts(data.products);
    setUsers(data.users ?? []);
    setChannels(data.channels ?? []);
    setSettings(data.settings);
    setSheetSync(data.sheetSync);
    setLoading(false);
  }

  useEffect(() => { void refresh().catch(() => setLoading(false)); }, []);

  const value = useMemo<StoreCtx>(() => ({
    orders,
    products,
    users,
    channels,
    teamMembers,
    settings,
    sheetSync,
    loading,
    refresh,
    importedRowKeys: new Set(),
    productById: (id) => products.find((p) => p.id === id),
    updateSettings: async (patch) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettingsFn({ data: patch });
      await refresh();
    },
    updateSheetSync: async (next) => {
      setSheetSync(next);
      await saveSheetSyncFn({ data: next });
    },
    addUser: async (name) => { const res = await addUserFn({ data: { name } }); await refresh(); return res.user; },
    addChannel: async (name) => { const res = await addChannelFn({ data: { name } }); await refresh(); return res.channel; },
    addMember: async (m) => { await addTeamMemberFn({ data: m }); await refresh(); },
    updateMember: async (m) => { await updateTeamMemberFn({ data: m }); await refresh(); },
    removeMember: async (id) => { await removeTeamMemberFn({ data: { id } }); await refresh(); },
    renameChannel: async (id, name) => { await renameChannelFn({ data: { id, name } }); await refresh(); },
    removeChannel: async (id) => { await removeChannelFn({ data: { id } }); await refresh(); },
    renameUser: async (id, name) => { await renameUserFn({ data: { id, name } }); await refresh(); },
    removeUser: async (id) => { await removeUserFn({ data: { id } }); await refresh(); },
    addOrder: async (input) => { await createOrderFn({ data: input }); await refresh(); },
    updateStatus: async (id, status) => { await setOrderStatusFn({ data: { id, status } }); await refresh(); },
    deleteOrder: async (id) => { await removeOrdersFn({ data: { ids: [id] } }); await refresh(); },
    deleteOrders: async (ids) => { await removeOrdersFn({ data: { ids } }); await refresh(); },
    addProduct: async (input) => { await createProductFn({ data: input }); await refresh(); },
    updateProduct: async (id, patch) => { await patchProductFn({ data: { id, patch } }); await refresh(); },
    deleteProduct: async (id) => { await removeProductFn({ data: { id } }); await refresh(); },
    importSheetRows: async (spreadsheetId, rows) => {
      const res = await importRowsFn({ data: { spreadsheetId, rows } });
      await refresh();
      return res;
    },
  }), [orders, products, users, channels, teamMembers, settings, sheetSync, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}