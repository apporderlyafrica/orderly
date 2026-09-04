import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Plus, Menu, X, RefreshCw, Settings, UserRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { useNavigate } from "@tanstack/react-router";

type Props = { onNewOrder: () => void };

const mainLinks = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/orders", label: "Commandes", icon: ShoppingBag },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/sync", label: "Synchro Sheets", icon: RefreshCw },
] as const;

const accountLinks = [
  { to: "/settings", label: "Paramètres", icon: Settings },
  { to: "/profile", label: "Profil", icon: UserRound },
] as const;

export function Sidebar({ onNewOrder }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const role = ((user as any)?.user_metadata ?? {}).role;
  const isClient = role === "client";
  const navLinks = isClient ? [{ to: "/orders", label: "Mes commandes", icon: ShoppingBag }] : mainLinks;
  const acctLinks = isClient ? [{ to: "/profile", label: "Profil", icon: UserRound }] : accountLinks;

  useEffect(() => { setOpen(false); }, [pathname]);

  const nav = (
    <>
      <div className="h-14 px-4 flex items-center border-b border-border justify-between">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-base font-extrabold tracking-tight text-foreground">Orderly</span>
        </Link>
        <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)} aria-label="Fermer le menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      {!isClient && (
        <div className="p-2 space-y-1.5">
          <button onClick={() => { onNewOrder(); setOpen(false); }}
            className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition shadow-[0_4px_16px_rgba(117,251,144,0.4)]">
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>
          <button onClick={() => { navigate({ to: "/products" }); setOpen(false); }}
            className="w-full inline-flex items-center justify-center gap-2 h-8 px-3 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent transition">
            <Package className="h-3.5 w-3.5" />
            Nouveau produit
          </button>
        </div>
      )}

      <div className="px-4 pt-2 pb-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Navigation</div>
      <nav className="px-2 py-0.5">
        {navLinks.map((l) => {
          const active = pathname === l.to;
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition ${active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-2 pb-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Compte</div>
      <nav className="px-2 py-0.5">
        {acctLinks.map((l) => {
          const active = pathname === l.to;
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition ${active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 mt-auto border-t border-border">
        {user && (
          <Link to="/profile" className="px-2 py-2 flex items-center gap-2.5 rounded-md hover:bg-accent">
            <span className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-extrabold">{(user.email ?? "O").slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Connecté</div>
              <div className="text-xs text-foreground truncate font-medium" title={user.email ?? ""}>{user.email}</div>
            </div>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent" aria-label="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-base font-extrabold tracking-tight">Orderly</span>
        </div>
        <button onClick={onNewOrder} className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground" aria-label="Nouvelle commande">
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-sidebar-bg flex-col sticky top-0 h-screen overflow-hidden">
        {nav}
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-sidebar-bg border-r border-border flex flex-col">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
