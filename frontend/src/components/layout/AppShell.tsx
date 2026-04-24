"use client";

import type { ReactNode } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ProfileMenu, type ProfileMenuLink } from "./ProfileMenu";

export interface AppShellProps {
  /** Sidebar renderizada à esquerda. Se `null`, o shell ocupa largura total. */
  sidebar?: ReactNode;
  /** Conteúdo à esquerda do header (breadcrumbs/título). */
  headerStart?: ReactNode;
  /** Conteúdo extra entre `headerStart` e as ações (ex.: link "Área do Participante"). */
  headerCenter?: ReactNode;
  /** Rótulo do papel no ProfileMenu. */
  roleLabel: string;
  /** Itens do ProfileMenu (Meu Perfil, etc.). */
  profileLinks?: ProfileMenuLink[];
  /** Config de tema do tenant para <ThemeProvider>. */
  themeConfig?: Record<string, unknown>;
  /** Mostrar sino de notificações. Default: true. */
  showNotifications?: boolean;
  /** Classe extra no <main>. */
  mainClassName?: string;
  /** Se true, envolve o conteúdo em um container max-w-7xl centralizado. Default: true. */
  centeredContent?: boolean;
  children: ReactNode;
}

/**
 * Shell único para áreas autenticadas (dashboard/speaker/monitor).
 * Centraliza header, ThemeProvider, ThemeToggle, notificações e
 * ProfileMenu para garantir consistência visual entre papéis.
 *
 * Área admin usa layout próprio (visual mais "risk-zone" com tema escuro)
 * e não passa por este shell por design.
 */
export function AppShell({
  sidebar,
  headerStart,
  headerCenter,
  roleLabel,
  profileLinks,
  themeConfig,
  showNotifications = true,
  mainClassName,
  centeredContent = true,
  children,
}: AppShellProps) {
  const content = (
    <div className="flex min-h-screen bg-background text-foreground">
      {sidebar}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-[40]">
          <div className="flex items-center gap-6 min-w-0">
            {headerStart}
            {headerCenter}
          </div>

          <ProfileMenu
            roleLabel={roleLabel}
            links={profileLinks}
            leftAccessory={
              <>
                <ThemeToggle />
                {showNotifications && (
                  <>
                    <button
                      type="button"
                      aria-label="Notificações"
                      className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative"
                    >
                      <BellIcon className="w-6 h-6" aria-hidden="true" />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
                    </button>
                    <div className="h-8 w-[1px] bg-border mx-2" />
                  </>
                )}
              </>
            }
          />
        </header>

        <main
          className={cn(
            "flex-1 overflow-y-auto bg-background/50 p-4 md:p-8",
            mainClassName,
          )}
        >
          {centeredContent ? (
            <div className="max-w-7xl mx-auto space-y-8">{children}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );

  return <ThemeProvider themeConfig={themeConfig}>{content}</ThemeProvider>;
}
