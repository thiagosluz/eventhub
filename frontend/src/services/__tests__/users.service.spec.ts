import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService, UserProfile } from '../users.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: UserProfile = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ORGANIZER',
    tenantId: 'tenant-1',
  };

  it('getMe should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockUser);
    const result = await usersService.getMe();
    expect(api.get).toHaveBeenCalledWith('/users/me');
    expect(result).toEqual(mockUser);
  });

  it('updateProfile should call API correctly', async () => {
    const updateData = { name: 'New Name' };
    vi.mocked(api.patch).mockResolvedValue({ ...mockUser, ...updateData });
    const result = await usersService.updateProfile(updateData);
    expect(api.patch).toHaveBeenCalledWith('/users/me', updateData);
    expect(result.name).toBe('New Name');
  });

  it('updatePassword should call API correctly', async () => {
    const data = { oldPassword: '123', newPassword: '456' };
    vi.mocked(api.patch).mockResolvedValue({ message: 'Success' });
    await usersService.updatePassword(data);
    expect(api.patch).toHaveBeenCalledWith('/users/me/password', data);
  });

  it('uploadAvatar should call API correctly', async () => {
    const file = new File([''], 'avatar.png', { type: 'image/png' });
    vi.mocked(api.post).mockResolvedValue({ id: 'img1', avatarUrl: 'url' });
    await usersService.uploadAvatar(file);
    expect(api.post).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData));
  });

  it('getPublicProfile should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ name: 'Public User' });
    await usersService.getPublicProfile('username123');
    expect(api.get).toHaveBeenCalledWith('/users/p/username123');
  });

  it('getUsers should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([mockUser]);
    await usersService.getUsers();
    expect(api.get).toHaveBeenCalledWith('/users');
  });

  it('getMonitoredEvents should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await usersService.getMonitoredEvents();
    expect(api.get).toHaveBeenCalledWith('/users/me/monitored-events');
  });

  it('checkUsernameAvailability should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ available: true });
    await usersService.checkUsernameAvailability('test');
    expect(api.get).toHaveBeenCalledWith('/users/check-username/test');
  });

  it('getSpeakerProfile should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await usersService.getSpeakerProfile('123');
    expect(api.get).toHaveBeenCalledWith('/speakers/123');
  });

  it('getMySpeakerProfile should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await usersService.getMySpeakerProfile();
    expect(api.get).toHaveBeenCalledWith('/speakers/me');
  });
});
