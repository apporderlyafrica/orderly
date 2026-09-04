import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchSheetRows } from "@/lib/sheets.functions";
import { useStore } from "@/lib/store";

function extractId(input: string): string | null {
  const t = input.trim();
  const m = t.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(t)) return t;
  return null;
}

/**
 * Tourne en arrière-plan sur toutes les pages tant que l'onglet est ouvert.
 * - Rattrape au démarrage (catch-up) → pas de commande perdue après reconnexion.
 * - Resync toutes les 30s.
 * - Resync immédiat quand l'onglet redevient visible.
 */
export function BackgroundSync() {
  const fetchRows = useServerFn(fetchSheetRows);
  const { importSheetRows, sheetSync } = useStore();
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (running.current || cancelled) return;
      const s = sheetSync;
      if (!s || !s.auto) return;
      const id = extractId(s.url);
      if (!id || !s.sheetTitle) return;
      running.current = true;
      try {
        const res = await fetchRows({ data: {
          spreadsheetId: id,
          sheetTitle: s.sheetTitle,
          mapping: s.mapping,
          hasHeader: s.hasHeader,
        }});
        if (res.ok) await importSheetRows(id, res.rows);
      } catch { /* silencieux en background */ }
      finally { running.current = false; }
    }

    tick();
    const interval = setInterval(tick, 30000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchRows, importSheetRows, sheetSync]);

  return null;
}
