import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY manquant");
  if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY manquant");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_SHEETS_API_KEY,
  };
}

const idSchema = z.string().min(10).max(100).regex(/^[a-zA-Z0-9_-]+$/);

export type SheetInfo = { title: string; sheetId: number; rowCount: number; columnCount: number };
export type ListSheetsResult = { ok: boolean; sheets: SheetInfo[]; title?: string; error?: string };

export const listSheets = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ spreadsheetId: idSchema }).parse(input))
  .handler(async ({ data }): Promise<ListSheetsResult> => {
    try {
      const url = `${GATEWAY_URL}/spreadsheets/${data.spreadsheetId}?fields=properties.title,sheets.properties`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, sheets: [], error: `Google Sheets [${res.status}]: ${body.slice(0, 200)}` };
      }
      const json = (await res.json()) as {
        properties?: { title?: string };
        sheets?: Array<{ properties?: { title?: string; sheetId?: number; gridProperties?: { rowCount?: number; columnCount?: number } } }>;
      };
      const sheets = (json.sheets ?? []).map((s) => ({
        title: s.properties?.title ?? "",
        sheetId: s.properties?.sheetId ?? 0,
        rowCount: s.properties?.gridProperties?.rowCount ?? 0,
        columnCount: s.properties?.gridProperties?.columnCount ?? 0,
      })).filter((s) => s.title);
      return { ok: true, sheets, title: json.properties?.title };
    } catch (e) {
      return { ok: false, sheets: [], error: e instanceof Error ? e.message : "Erreur inconnue" };
    }
  });

const colRegex = /^[A-Z]{1,2}$/;
const mappingSchema = z.object({
  nom: z.string().regex(colRegex),
  telephone: z.string().regex(colRegex),
  produit: z.string().regex(colRegex),
  ville: z.string().regex(colRegex),
  upsells: z.string().regex(colRegex).optional().or(z.literal("")),
});

const fetchSchema = z.object({
  spreadsheetId: idSchema,
  sheetTitle: z.string().min(1).max(200),
  mapping: mappingSchema,
  hasHeader: z.boolean(),
});

export type SheetRow = {
  rowIndex: number;
  nom: string;
  telephone: string;
  produit: string;
  ville: string;
  upsells?: string[];
};

export type FetchSheetResult = { ok: boolean; rows: SheetRow[]; error?: string; scanned?: number };

function colLetterToIndex(letter: string): number {
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function quoteSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export const fetchSheetRows = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => fetchSchema.parse(input))
  .handler(async ({ data }): Promise<FetchSheetResult> => {
    try {
      const range = `${quoteSheetTitle(data.sheetTitle)}!A:Z`;
      const url = `${GATEWAY_URL}/spreadsheets/${data.spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, rows: [], error: `Google Sheets [${res.status}]: ${body.slice(0, 200)}` };
      }
      const json = (await res.json()) as { values?: string[][] };
      const values = json.values ?? [];

      const iNom = colLetterToIndex(data.mapping.nom);
      const iTel = colLetterToIndex(data.mapping.telephone);
      const iProd = colLetterToIndex(data.mapping.produit);
      const iVille = colLetterToIndex(data.mapping.ville);
      const iUps = data.mapping.upsells ? colLetterToIndex(data.mapping.upsells) : -1;

      const start = data.hasHeader ? 1 : 0;
      const rows: SheetRow[] = [];
      for (let i = start; i < values.length; i++) {
        const r = values[i] ?? [];
        const nom = (r[iNom] ?? "").toString().trim();
        const telephone = (r[iTel] ?? "").toString().trim();
        const produit = (r[iProd] ?? "").toString().trim();
        const ville = (r[iVille] ?? "").toString().trim();
        const upsellsRaw = iUps >= 0 ? (r[iUps] ?? "").toString() : "";
        const upsells = upsellsRaw
          .split(/[,;\n|]/)
          .map((s) => s.trim())
          .filter((s) => s && s !== "-");
        const cleanNom = nom === "-" ? "" : nom;
        if (!telephone || !produit) continue;
        rows.push({
          rowIndex: i + 1,
          nom: cleanNom || "Client",
          telephone,
          produit,
          ville: ville || "—",
          upsells: upsells.length ? upsells : undefined,
        });
      }
      return { ok: true, rows, scanned: values.length };
    } catch (e) {
      return { ok: false, rows: [], error: e instanceof Error ? e.message : "Erreur inconnue" };
    }
  });
