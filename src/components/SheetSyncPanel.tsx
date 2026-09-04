import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, CheckCircle2, AlertTriangle, Link2, Loader2 } from "lucide-react";
import { fetchSheetRows, listSheets, type SheetInfo } from "@/lib/sheets.functions";
import { useStore } from "@/lib/store";

type Mapping = { nom: string; telephone: string; produit: string; ville: string; upsells: string };

type Settings = {
  url: string;
  sheetTitle: string;
  hasHeader: boolean;
  mapping: Mapping;
  auto: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  url: "",
  sheetTitle: "",
  hasHeader: false,
  mapping: { nom: "A", telephone: "B", ville: "C", produit: "F", upsells: "" },
  auto: true,
};

const COLUMN_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
const COLUMN_LETTERS_OPT = ["", ...COLUMN_LETTERS];

function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export function SheetSyncPanel() {
  const { importSheetRows, sheetSync, updateSheetSync } = useStore();
  const fetchRows = useServerFn(fetchSheetRows);
  const fetchSheetList = useServerFn(listSheets);

  const [settings, setLocalSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, ...sheetSync });
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const [status, setStatus] = useState<"idle" | "syncing" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [totalAdded, setTotalAdded] = useState(0);

  const spreadsheetId = useMemo(() => extractSpreadsheetId(settings.url), [settings.url]);
  const isConfigured = !!spreadsheetId && !!settings.sheetTitle;

  useEffect(() => {
    setLocalSettings({ ...DEFAULT_SETTINGS, ...sheetSync });
  }, [sheetSync]);

  function setSettings(next: Settings | ((prev: Settings) => Settings)) {
    setLocalSettings((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      void updateSheetSync(resolved);
      return resolved;
    });
  }

  async function loadSheetList() {
    if (!spreadsheetId) {
      setStatus("error");
      setMessage("URL ou ID Google Sheets invalide.");
      return;
    }
    setLoadingSheets(true);
    setStatus("idle");
    setMessage("");
    try {
      const res = await fetchSheetList({ data: { spreadsheetId } });
      if (!res.ok) {
        setStatus("error");
        setMessage(res.error ?? "Impossible de charger les onglets");
        setSheets([]);
        return;
      }
      setSheets(res.sheets);
      // Auto-select if only one or if current selection isn't in list
      if (res.sheets.length && !res.sheets.find((s) => s.title === settings.sheetTitle)) {
        const preferred = res.sheets.find((s) => /commande/i.test(s.title)) ?? res.sheets[0];
        setSettings((s) => ({ ...s, sheetTitle: preferred.title }));
      }
      setStatus("ok");
      setMessage(`${res.sheets.length} onglet(s) trouvé(s).`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoadingSheets(false);
    }
  }

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  async function sync(silent = false) {
    const s = settingsRef.current;
    const id = extractSpreadsheetId(s.url);
    if (!id || !s.sheetTitle) {
      if (!silent) { setStatus("error"); setMessage("Configuration incomplète."); }
      return;
    }
    if (!silent) setStatus("syncing");
    try {
      const res = await fetchRows({ data: {
        spreadsheetId: id,
        sheetTitle: s.sheetTitle,
        mapping: s.mapping,
        hasHeader: s.hasHeader,
      }});
      if (!res.ok) {
        setStatus("error");
        setMessage(res.error ?? "Erreur inconnue");
        return;
      }
      const { added } = await importSheetRows(id, res.rows);
      setTotalAdded((t) => t + added);
      setLastSync(new Date().toLocaleTimeString("fr-FR"));
      setStatus("ok");
      setMessage(added > 0
        ? `${added} nouvelle(s) commande(s) importée(s).`
        : `À jour — ${res.rows.length} ligne(s) lue(s), aucune nouveauté.`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Erreur réseau");
    }
  }

  // Auto-sync : rattrape au montage + toutes les 15s tant que la config est valide
  useEffect(() => {
    if (!settings.auto || !isConfigured) return;
    sync(true); // catch-up immédiat à l'ouverture de l'app
    const interval = setInterval(() => { sync(true); }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.auto, settings.url, settings.sheetTitle, settings.hasHeader,
      settings.mapping.nom, settings.mapping.telephone, settings.mapping.produit, settings.mapping.ville, settings.mapping.upsells,
      isConfigured]);

  return (
    <div className="space-y-4">
      {/* Step 1 */}
      <div className="bg-surface border border-border rounded-lg p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0">
            <Link2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">1. Connecter la feuille</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Colle l'URL de ton Google Sheets puis charge ses onglets.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={settings.url}
            onChange={(e) => setSettings((s) => ({ ...s, url: e.target.value, sheetTitle: "" }))}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className="flex-1 h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40"
          />
          <button
            onClick={loadSheetList}
            disabled={!spreadsheetId || loadingSheets}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {loadingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Charger les onglets
          </button>
        </div>
      </div>

      {/* Step 2 */}
      {sheets.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">2. Choisir l'onglet et les colonnes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Indique quelle colonne contient quelle info.</p>
          </div>

          <div className="space-y-4">
            <Field label="Onglet à synchroniser">
              <select
                value={settings.sheetTitle}
                onChange={(e) => setSettings((s) => ({ ...s, sheetTitle: e.target.value }))}
                className={inputCls}
              >
                <option value="">— Sélectionner —</option>
                {sheets.map((s) => (
                  <option key={s.sheetId} value={s.title}>{s.title}</option>
                ))}
              </select>
            </Field>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.hasHeader}
                onChange={(e) => setSettings((s) => ({ ...s, hasHeader: e.target.checked }))}
                className="h-4 w-4 accent-foreground"
              />
              Ma feuille a une 1ère ligne d'en-têtes (à ignorer)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <ColMap label="Nom" value={settings.mapping.nom}
                onChange={(v) => setSettings((s) => ({ ...s, mapping: { ...s.mapping, nom: v } }))} />
              <ColMap label="Téléphone" value={settings.mapping.telephone}
                onChange={(v) => setSettings((s) => ({ ...s, mapping: { ...s.mapping, telephone: v } }))} />
              <ColMap label="Ville" value={settings.mapping.ville}
                onChange={(v) => setSettings((s) => ({ ...s, mapping: { ...s.mapping, ville: v } }))} />
              <ColMap label="Produit" value={settings.mapping.produit}
                onChange={(v) => setSettings((s) => ({ ...s, mapping: { ...s.mapping, produit: v } }))} />
              <ColMap label="Upsells (option.)" value={settings.mapping.upsells} optional
                onChange={(v) => setSettings((s) => ({ ...s, mapping: { ...s.mapping, upsells: v } }))} />
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Upsells : une seule colonne contenant les produits additionnels séparés par <code>,</code> <code>;</code> ou <code>|</code>.
            </p>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {isConfigured && (
        <div className="bg-surface border border-border rounded-lg p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">3. Synchronisation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Les nouvelles lignes sont importées automatiquement.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.auto}
                onChange={(e) => setSettings((s) => ({ ...s, auto: e.target.checked }))}
                className="h-4 w-4 accent-foreground"
              />
              Sync auto (15s)
            </label>
            <button
              onClick={() => sync(false)}
              disabled={status === "syncing"}
              className="sm:ml-auto inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {status === "syncing"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              Synchroniser maintenant
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      {status !== "idle" && (
        <div
          className={`text-xs rounded-md px-3 py-2.5 flex items-start gap-2 border ${
            status === "error"
              ? "bg-status-cancelled-bg text-status-cancelled-fg border-transparent"
              : status === "ok"
              ? "bg-status-delivered-bg text-status-delivered-fg border-transparent"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {status === "error"
            ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            : status === "syncing"
            ? <Loader2 className="h-3.5 w-3.5 mt-0.5 shrink-0 animate-spin" />
            : <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          <div className="min-w-0">
            <div>{message || (status === "syncing" ? "Synchronisation en cours…" : "")}</div>
            {lastSync && (
              <div className="opacity-80 mt-0.5">
                Dernière synchro : {lastSync} · {totalAdded} commande(s) importée(s) au total
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md border border-border bg-surface text-sm outline-none focus:border-foreground/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ColMap({ label, value, onChange, optional = false }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean }) {
  const opts = optional ? COLUMN_LETTERS_OPT : COLUMN_LETTERS;
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {opts.map((l) => <option key={l || "none"} value={l}>{l ? `Colonne ${l}` : "— Aucune —"}</option>)}
      </select>
    </Field>
  );
}
