import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { StoreProvider } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { NewOrderModal } from "@/components/NewOrderModal";
import { BackgroundSync } from "@/components/BackgroundSync";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <StoreProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar onNewOrder={() => setModalOpen(true)} />
        <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0">
          <Outlet />
        </main>
        <NewOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
        <BackgroundSync />
        <MobileNav onNewOrder={() => setModalOpen(true)} />
      </div>
    </StoreProvider>
  );
}
