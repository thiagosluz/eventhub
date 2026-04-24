import { api } from '../lib/api';
import { AuthResponse, LoginDto, RegisterOrganizerDto, RegisterParticipantDto, LoginResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginDto): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/auth/login', data);
  },

  authenticate2fa: async (code: string, tempToken: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/2fa/authenticate', { code, tempToken });
  },

  generate2fa: async (): Promise<{ qrCode: string }> => {
    return api.post<{ qrCode: string }>('/auth/2fa/generate', {});
  },

  turnOn2fa: async (code: string): Promise<{ ok: boolean, recoveryCodes?: string[] }> => {
    return api.post('/auth/2fa/turn-on', { code });
  },

  turnOff2fa: async (code: string): Promise<void> => {
    return api.post('/auth/2fa/turn-off', { code });
  },

  regenerateRecoveryCodes: async (): Promise<{ recoveryCodes: string[] }> => {
    return api.post('/auth/2fa/recovery-codes/regenerate');
  },

  registerOrganizer: async (data: RegisterOrganizerDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register-organizer', data);
  },

  registerParticipant: async (data: RegisterParticipantDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register-participant', data);
  },

  refresh: async (refresh_token: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/refresh', { refresh_token });
  },

  changePasswordForced: async (newPassword: string): Promise<void> => {
    return api.post('/auth/change-password-forced', { newPassword });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
