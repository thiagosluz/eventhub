import { api } from '../lib/api';
import { AuthResponse, LoginDto, RegisterOrganizerDto, RegisterParticipantDto } from '../types/auth';

export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', data);
  },

  registerOrganizer: async (data: RegisterOrganizerDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register-organizer', data);
  },

  registerParticipant: async (data: RegisterParticipantDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register-participant', data);
  },
};
