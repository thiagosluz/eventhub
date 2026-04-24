"use client";

import Link from "next/link";
import { ArrowLeftIcon, UserIcon } from "@heroicons/react/24/outline";
import { AppGuard, AppShell } from "@/components/layout";
import { AREA_ROLES } from "@/lib/auth/roles";

const PROFILE_LINKS = [
  { href: "/profile", label: "Meu Perfil", icon: UserIcon },
];

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppGuard allowedRoles={AREA_ROLES.monitor}>
      <AppShell
        roleLabel="Monitor"
        profileLinks={PROFILE_LINKS}
        showNotifications={false}
        centeredContent={false}
        mainClassName="p-0"
        headerStart={
          <>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Voltar ao Perfil</span>
            </Link>
            <div className="h-6 w-[1px] bg-border mx-2" />
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">
              Área do Monitor
            </h2>
          </>
        }
      >
        {children}
      </AppShell>
    </AppGuard>
  );
}
