import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { isValidSenegalPhone, formatXOF } from "@/lib/format";
import { DELIVERY_ZONES, ZONE_LABELS, deliveryFeeFor, type DeliveryZone } from "@/lib/store-data";

type Props = { open: boolean; onClose: () => void };

export function NewOrderModal({ open, onClose }: Props) {
  const { products, users, channels, addOrder, addUser, addChannel, settings } = useStore();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [productId, setProductId] = useState("");
  const [upsellIds, setUpsellIds] = useState<string[]>([]);
  const [deliveryRegion, setDeliveryRegion] = useState<DeliveryZone | "">("");
  const [address, setAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Produits visibles = ceux propres au commerçant/canal choisi + les produits partagés.
  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      const okUser = !userId || !p.userId || p.userId === userId;
      const okChannel = !channelId || !p.channelId || p.channelId === channelId;
      return okUser && okChannel;
    });
  }, [products, userId, channelId]);

  // Synchronise productId avec la liste de produits chargée / filtrée.
  useEffect(() => {
    if (visibleProducts.length === 0) return;
    if (!productId || !visibleProducts.some((p) => p.id === productId)) {
      setProductId(visibleProducts[0].id);
    }
  }, [visibleProducts, productId]);

  useEffect(() => { setUpsellIds([]); }, [userId, channelId]);

  if (!open) return null;

  function toggleUpsell(id: string) {
    setUpsellIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function promptAddUser() {
    const raw = window.prompt("Nom du commerçant :");
    if (!raw) return;
    const name = raw.trim();
    if (!name) return;
    const u = await addUser(name);
    setUserId(u.id);
  }

  async function promptAddChannel() {
    const raw = window.prompt("Nom du canal :");
    if (!raw) return;
    const name = raw.trim();
    if (!name) return;
    const c = await addChannel(name);
    setChannelId(c.id);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = customer.trim();
    const ph = phone.trim();
    const addr = address.trim();
    if (name.length < 2 || name.length > 80) return setError("Nom invalide (2 à 80 caractères).");
    if (!isValidSenegalPhone(ph)) return setError("Numéro sénégalais invalide. Format : 77 123 45 67");
    if (!productId) return setError("Veuillez choisir un produit.");
    if (!deliveryRegion) return setError("Veuillez choisir une région de livraison.");
    if (addr.length < 2 || addr.length > 80) return setError("Adresse de livraison invalide.");

    const cleanUpsells = upsellIds.filter((id) => id !== productId);
    addOrder({ customer: name, phone: ph, productId, city: addr, upsellIds: cleanUpsells, deliveryZone: deliveryRegion, paid, userId: userId || undefined, channelId: channelId || undefined, clientEmail: clientEmail.trim() || undefined });
    setCustomer(""); setPhone(""); setUserId(""); setChannelId(""); setAddress(""); setClientEmail(""); setUpsellIds([]); setProductId(visibleProducts[0]?.id ?? ""); setDeliveryRegion(""); setPaid(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/30 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-xl sm:rounded-lg shadow-sm max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 h-14 border-b border-border sticky top-0 bg-surface">
          <h2 className="text-sm font-semibold">Nouvelle commande</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Nom du client">
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} required maxLength={80} className={inputCls} placeholder="ex: Awa Diop" />
          </Field>
          <Field label="Téléphone (Sénégal)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              inputMode="tel"
              maxLength={20}
              className={inputCls}
              placeholder="77 123 45 67"
            />
          </Field>
          <Field label="Commerçant">
            <div className="flex gap-2">
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                <option value="">— Tous / général —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button type="button" onClick={promptAddUser} className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent" title="Ajouter un commerçant"><Plus className="h-4 w-4" /></button>
            </div>
          </Field>
          <Field label="Canal d'acquisition">
            <div className="flex gap-2">
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
                <option value="">— Tous / général —</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={promptAddChannel} className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent" title="Ajouter un canal"><Plus className="h-4 w-4" /></button>
            </div>
          </Field>
          <Field label="Produit principal">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required className={inputCls}>
              {visibleProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("fr-FR")} FCFA</option>
              ))}
            </select>
            {visibleProducts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Aucun produit pour cette sélection. Créez-en un dans Produits.</p>
            )}
          </Field>
          {visibleProducts.filter((p) => p.id !== productId).length > 0 && (
            <Field label="Upsells (optionnel)">
              <div className="border border-border rounded-md max-h-40 overflow-auto divide-y divide-border">
                {visibleProducts.filter((p) => p.id !== productId).map((p) => (
                  <label key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={upsellIds.includes(p.id)}
                        onChange={() => toggleUpsell(p.id)}
                        className="h-4 w-4 accent-foreground"
                      />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{p.price.toLocaleString("fr-FR")} FCFA</span>
                  </label>
                ))}
              </div>
            </Field>
          )}
          <Field label="Région de livraison">
            <select value={deliveryRegion} onChange={(e) => setDeliveryRegion(e.target.value as DeliveryZone | "")} required className={inputCls}>
              <option value="">Choisir la région…</option>
              {DELIVERY_ZONES.map((z) => (
                <option key={z} value={z}>{ZONE_LABELS[z]} · {formatXOF(deliveryFeeFor("", settings, z))}</option>
              ))}
            </select>
          </Field>
          {deliveryRegion && (
            <>
              <Field label="Adresse de livraison">
                <input value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={80} className={inputCls} placeholder="ex: Rue 10, Médina, Dakar" />
              </Field>
              <p className="text-xs text-muted-foreground">
                Livraison {ZONE_LABELS[deliveryRegion]} : <span className="font-medium text-foreground tabular-nums">{formatXOF(deliveryFeeFor("", settings, deliveryRegion))} FCFA</span>
              </p>
            </>
          )}

          <Field label="Email client (optionnel)">
            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} type="email" maxLength={80} className={inputCls} placeholder="ex: client@email.com — il pourra suivre sa commande" />
          </Field>

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-foreground" />
            <span className="text-sm">Déjà payée</span>
            <span className="text-xs text-muted-foreground ml-auto">{paid ? "Prête à livrer" : "À encaisser"}</span>
          </label>

          {error && (
            <p className="text-xs text-status-cancelled-fg bg-status-cancelled-bg rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-border text-sm hover:bg-accent">Annuler</button>
            <button type="submit" className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90">Créer</button>
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
