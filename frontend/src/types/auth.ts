/**
 * Papéis emitidos pelo backend (backend/prisma/schema.prisma -> UserRole).
 * "MONITOR" NÃO é um papel: monitores são PARTICIPANTs promovidos por evento
 * (checado via membership/permission no backend, não via role global).
 * "ADMIN" é legado (nunca é emitido); mantido aqui apenas por compatibilidade
 * histórica de tipos até próxima limpeza.
 */
export type UserRole =
  | "ORGANIZER"
  | "REVIEWER"
  | "PARTICIPANT"
  | "SPEAKER"
  | "SUPER_ADMIN"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  tenantId?: string;
  isSpeaker?: boolean;
  mustChangePassword?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface RegisterOrganizerDto extends LoginDto {
  name: string;
  tenantName: string;
  tenantSlug: string;
  password: string;
}

export interface RegisterParticipantDto extends LoginDto {
  name: string;
  password: string;
}
