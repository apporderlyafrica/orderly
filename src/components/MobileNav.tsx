import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Settings, Plus } from "lucide-react";

type Props = { onNewOrder: () => void };

export function MobileNav({ onNewOrder }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs = [
    { to: "/dashboard", label: "Accueil", icon: LayoutDashboard },
    { to: "/orders", label: "Commandes", icon: ShoppingBag },
    { to: "/products", label: "Produits", icon: Package },
    { to: "/settings", label: "Réglages", icon: Settings },
  ];

  const half = 2;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface/90 backdrop-blur-md border-t border-border flex items-stretch px-2">
      {tabs.slice(0, half).map((t) => {
        const active = pathname === t.to;
        const Icon = t.icon;
        return (
          <Link key={t.to} to={t.to} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
            <Icon className={`h-5 w-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
            <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
          </Link>
        );
      })}

      <button onClick={onNewOrder} aria-label="Nouvelle commande"
        className="flex-1 flex flex-col items-center justify-center py-2">
        <span className="-mt-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center shadow-[0_6px_24px_-6px_rgba(117,251,144,0.8)]">
          <Plus className="h-6 w-6" />
        </span>
      </button>

      {tabs.slice(half).map((t) => {
        const active = pathname === t.to;
        const Icon = t.icon;
        return (
          <Link key={t.to} to={t.to} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
            <Icon className={`h-5 w-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
            <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
