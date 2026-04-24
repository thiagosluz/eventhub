"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/24/outline";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AppGuard, AppShell } from "@/components/layout";
import { useAuth } from "@/context/AuthContext";
import { tenantsService } from "@/services/tenants.service";
import { AREA_ROLES } from "@/lib/auth/roles";
import { Tenant } from "@/types/event";

const PROFILE_LINKS = [
  { href: "/speaker/profile", label: "Meu Perfil", icon: UserIcon },
];

export default function SpeakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const isAllowed = user && (user.role === "SPEAKER" || user.isSpeaker);
    if (isAuthenticated && isAllowed) {
      tenantsService.getMe().then(setTenant).catch(console.error);
    }
  }, [isAuthenticated, user]);

  return (
    <AppGuard allowedRoles={AREA_ROLES.speaker} allowIfSpeaker>
      <AppShell
        sidebar={<Sidebar tenant={tenant} />}
        themeConfig={tenant?.themeConfig as Record<string, unknown> | undefined}
        roleLabel="Palestrante Oficial"
        profileLinks={PROFILE_LINKS}
        headerStart={
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Portal do <span className="text-primary italic">Palestrante</span>
          </h2>
        }
        headerCenter={
          <Link
            href="/profile"
            className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all uppercase tracking-tighter"
          >
            Área do Participante
          </Link>
        }
      >
        {children}
      </AppShell>
    </AppGuard>
  );
}
