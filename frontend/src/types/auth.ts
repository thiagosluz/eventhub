export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'ADMIN' | 'REVIEWER';
  avatarUrl?: string;
  bio?: string;
  tenantId?: string;
}

export interface AuthResponse {
  access_token: string;
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
