export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'ADMIN' | 'REVIEWER' | 'SPEAKER' | 'SUPER_ADMIN';
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
