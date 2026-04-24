"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";

export interface AppGuardProps {
  /** Papéis autorizados a acessar a área. */
  allowedRoles: readonly UserRole[];
  /**
   * Se true, usuários com `isSpeaker=true` também são permitidos mesmo
   * que seu `role` não esteja em `allowedRoles` (útil para /speaker).
   */
  allowIfSpeaker?: boolean;
  /** Fallback exibido enquanto o auth carrega. */
  loadingFallback?: ReactNode;
  /** Rota para onde redirecionar não autenticados. Default: /auth/login. */
  redirectTo?: string;
  children: ReactNode;
}

function DefaultLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

/**
 * Guard de cliente para áreas autenticadas. Funciona em conjunto com
 * `proxy.ts` (primeira barreira no servidor) e garante que:
 * - usuários não autenticados sejam redirecionados para o login;
 * - papéis não autorizados sejam redirecionados para sua home
 *   (via AuthContext), evitando estados "zumbi" na UI.
 */
export function AppGuard({
  allowedRoles,
  allowIfSpeaker = false,
  loadingFallback,
  redirectTo = "/auth/login",
  children,
}: AppGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = Boolean(
    user &&
      (allowedRoles.includes(user.role) ||
        (allowIfSpeaker && user.isSpeaker === true)),
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }
    if (!isAllowed) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, user, isAllowed, router, redirectTo]);

  if (isLoading) {
    return <>{loadingFallback ?? <DefaultLoading />}</>;
  }

  if (!isAuthenticated || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}
