import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login deve enviar credenciais e retornar AuthResponse', async () => {
    const loginData = { email: 'test@example.com', password: 'password' };
    const mockResponse = { access_token: 'at', refresh_token: 'rt', user: {} };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await authService.login(loginData);

    expect(api.post).toHaveBeenCalledWith('/auth/login', loginData);
    expect(result).toEqual(mockResponse);
  });

  it('registerOrganizer deve enviar dados de organizador', async () => {
    const regData = { email: 'org@example.com', password: 'password', name: 'Org', tenantName: 'Tenant' };
    const mockResponse = { access_token: 'at', refresh_token: 'rt', user: {} };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await authService.registerOrganizer(regData as any);

    expect(api.post).toHaveBeenCalledWith('/auth/register-organizer', regData);
    expect(result.access_token).toBe('at');
  });

  it('registerParticipant deve enviar dados de participante', async () => {
    const regData = { email: 'part@example.com', password: 'password', name: 'Part' };
    const mockResponse = { access_token: 'at', refresh_token: 'rt', user: {} };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await authService.registerParticipant(regData as any);

    expect(api.post).toHaveBeenCalledWith('/auth/register-participant', regData);
    expect(result.access_token).toBe('at');
  });

  it('refresh deve renovar o token de acesso', async () => {
    const mockResponse = { access_token: 'new-at', refresh_token: 'rt', user: {} };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await authService.refresh('old-rt');

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'old-rt' });
    expect(result.access_token).toBe('new-at');
  });

  it('changePasswordForced deve enviar nova senha após troca obrigatória', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await authService.changePasswordForced('new-pass');

    expect(api.post).toHaveBeenCalledWith('/auth/change-password-forced', { newPassword: 'new-pass' });
  });
});
