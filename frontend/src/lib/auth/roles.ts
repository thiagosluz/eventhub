import type { UserRole } from "@/types/auth";

/**
 * Fonte única da verdade para autorização por área no app.
 * Usada tanto pelo `proxy.ts` (middleware/server) quanto pelos
 * guards de client (AppGuard) para evitar divergências.
 *
 * Observação importante sobre /monitor:
 * "Monitor" NÃO é um papel global. Qualquer usuário autenticado pode ser
 * promovido a monitor de um EVENTO específico (tabela EventMonitor no backend).
 * Por isso a allow list de /monitor inclui TODOS os papéis autenticados:
 * a verificação real (se o user é monitor deste evento) é feita pelo
 * MonitorGuard do backend, que tem acesso ao DB.
 */
export const AREA_ROLES = {
  admin: ["SUPER_ADMIN"] as const satisfies readonly UserRole[],
  dashboard: ["ORGANIZER", "REVIEWER"] as const satisfies readonly UserRole[],
  speaker: ["SPEAKER", "ORGANIZER", "SUPER_ADMIN"] as const satisfies readonly UserRole[],
  monitor: [
    "PARTICIPANT",
    "SPEAKER",
    "REVIEWER",
    "ORGANIZER",
    "SUPER_ADMIN",
  ] as const satisfies readonly UserRole[],
} as const;

export type AreaKey = keyof typeof AREA_ROLES;

/**
 * Rota "home" de cada papel após o login. Mudar aqui reflete em todo
 * o fluxo de autenticação.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  ORGANIZER: "/dashboard",
  REVIEWER: "/dashboard",
  SPEAKER: "/speaker",
  PARTICIPANT: "/profile",
  ADMIN: "/dashboard",
};

/**
 * Rótulo humano curto para exibir em headers, dropdowns, etc.
 */
export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ORGANIZER: "Organizador",
  REVIEWER: "Revisor",
  SPEAKER: "Palestrante",
  PARTICIPANT: "Participante",
  ADMIN: "Admin",
};

export function homeFor(role: UserRole): string {
  return ROLE_HOME[role] ?? "/";
}

export function labelFor(role: UserRole): string {
  return ROLE_LABEL[role] ?? role;
}
