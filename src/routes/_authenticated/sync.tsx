import { createFileRoute } from "@tanstack/react-router";
import { SheetSyncPanel } from "@/components/SheetSyncPanel";

export const Route = createFileRoute("/_authenticated/sync")({
  component: SyncPage,
  head: () => ({ meta: [{ title: "Synchro Google Sheets — Orderly" }] }),
});

function SyncPage() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Synchronisation Google Sheets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connectez une feuille pour importer automatiquement chaque nouvelle commande.
        </p>
      </header>
      <SheetSyncPanel />
    </div>
  );
}
