"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AppGuard, AppShell } from "@/components/layout";
import { useAuth } from "@/context/AuthContext";
import { tenantsService } from "@/services/tenants.service";
import { AREA_ROLES, labelFor } from "@/lib/auth/roles";
import { Tenant } from "@/types/event";

const PROFILE_LINKS = [
  { href: "/dashboard/profile", label: "Meu Perfil", icon: UserIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const fetchTenant = () => {
      if (
        isAuthenticated &&
        (user?.role === "ORGANIZER" || user?.role === "REVIEWER")
      ) {
        tenantsService.getMe().then(setTenant).catch(console.error);
      }
    };

    fetchTenant();
    window.addEventListener("tenant-updated", fetchTenant);
    return () => window.removeEventListener("tenant-updated", fetchTenant);
  }, [isAuthenticated, user]);

  return (
    <AppGuard allowedRoles={AREA_ROLES.dashboard}>
      <AppShell
        sidebar={<Sidebar tenant={tenant} />}
        themeConfig={tenant?.themeConfig as Record<string, unknown> | undefined}
        roleLabel={user ? labelFor(user.role) : ""}
        profileLinks={PROFILE_LINKS}
        headerStart={
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground truncate">
            {tenant?.name || "Dashboard"}
            <span className="text-border mx-2">/</span>
            <span className="text-foreground">Visão Geral</span>
          </h2>
        }
      >
        {children}
      </AppShell>
    </AppGuard>
  );
}
