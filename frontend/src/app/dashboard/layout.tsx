"use client";

import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { tenantsService } from "@/services/tenants.service";
import { Tenant } from "@/types/event";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const router = useRouter();

  useEffect(() => {
    const allowedRoles = ["ORGANIZER", "REVIEWER"];
    if (!isLoading && (!isAuthenticated || !user || !allowedRoles.includes(user.role))) {
      router.push("/auth/login");
    }

    const fetchTenant = () => {
      if (isAuthenticated && (user?.role === 'ORGANIZER' || user?.role === 'REVIEWER')) {
        tenantsService.getMe().then(setTenant).catch(console.error);
      }
    };

    fetchTenant();

    window.addEventListener('tenant-updated', fetchTenant);
    return () => window.removeEventListener('tenant-updated', fetchTenant);
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allowedRoles = ["ORGANIZER", "REVIEWER"];
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <ThemeProvider themeConfig={tenant?.themeConfig}>
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar tenant={tenant} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              {tenant?.name || 'Dashboard'} <span className="text-border mx-2">/</span> <span className="text-foreground">Visão Geral</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-tight leading-none">{user.name}</p>
                <p className="text-[10px] font-bold text-primary uppercase leading-tight">
                  {user.role === 'ORGANIZER' ? 'Admin da Organização' : 'Revisor Científico'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <UserCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-background/50">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}
