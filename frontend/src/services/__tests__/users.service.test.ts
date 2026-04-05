import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from '../users.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMe deve buscar o perfil do usuário logado', async () => {
    const mockData = { id: 'u1', name: 'User 1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getMe();

    expect(api.get).toHaveBeenCalledWith('/users/me');
    expect(result).toEqual(mockData);
  });

  it('updateProfile deve enviar PATCH para atualizar dados', async () => {
    const profileData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: 'u1', ...profileData });

    const result = await usersService.updateProfile(profileData);

    expect(api.patch).toHaveBeenCalledWith('/users/me', profileData);
    expect(result.name).toBe('Updated');
  });

  it('updatePassword deve enviar PATCH para trocar senha', async () => {
    const passData = { oldPassword: 'old', newPassword: 'new' };
    (api.patch as any).mockResolvedValue({ message: 'Success' });

    const result = await usersService.updatePassword(passData);

    expect(api.patch).toHaveBeenCalledWith('/users/me/password', passData);
    expect(result.message).toBe('Success');
  });

  it('uploadAvatar deve enviar FormData com arquivo de imagem', async () => {
    const mockData = { id: 'a1', avatarUrl: 'url' };
    const file = new File([''], 'avatar.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue(mockData);

    const result = await usersService.uploadAvatar(file);

    expect(api.post).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData));
    expect(result).toEqual(mockData);
  });

  it('getPublicProfile deve buscar perfil por username', async () => {
    const mockData = { id: 'u1', username: 'testuser' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getPublicProfile('testuser');

    expect(api.get).toHaveBeenCalledWith('/users/p/testuser');
    expect(result).toEqual(mockData);
  });

  it('getUsers deve listar usuários do sistema', async () => {
    const mockData = [{ id: 'u1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getUsers();

    expect(api.get).toHaveBeenCalledWith('/users');
    expect(result).toEqual(mockData);
  });

  it('getMonitoredEvents deve buscar eventos onde o usuário é monitor', async () => {
    const mockData = [{ eventId: 'ev1', event: {} }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getMonitoredEvents();

    expect(api.get).toHaveBeenCalledWith('/users/me/monitored-events');
    expect(result).toEqual(mockData);
  });

  it('checkUsernameAvailability deve verificar se o username está livre', async () => {
    const mockData = { available: true };
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.checkUsernameAvailability('testuser');

    expect(api.get).toHaveBeenCalledWith('/users/check-username/testuser');
    expect(result.available).toBe(true);
  });

  it('getSpeakerProfile deve buscar perfil de palestrante pelo ID', async () => {
    const mockData = { id: 's1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getSpeakerProfile('s1');

    expect(api.get).toHaveBeenCalledWith('/speakers/s1');
    expect(result).toEqual(mockData);
  });

  it('getMySpeakerProfile deve buscar perfil de palestrante do usuário logado', async () => {
    const mockData = { id: 's1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await usersService.getMySpeakerProfile();

    expect(api.get).toHaveBeenCalledWith('/speakers/me');
    expect(result).toEqual(mockData);
  });
});
