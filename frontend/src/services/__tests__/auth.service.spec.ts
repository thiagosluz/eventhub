import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { api } from '../../lib/api';

// Mock the api instance
vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse = {
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'ORGANIZER' },
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
  };

  it('should call login correctly', async () => {
    const loginData = { email: 'test@example.com', password: 'password123' };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await authService.login(loginData);

    expect(api.post).toHaveBeenCalledWith('/auth/login', loginData);
    expect(result).toEqual(mockResponse);
  });

  it('should call registerOrganizer correctly', async () => {
    const registerData = { 
      email: 'organizer@example.com', 
      password: 'password123',
      name: 'Organizer Name',
      tenantName: 'My Tenant',
      slug: 'my-tenant'
    };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await authService.registerOrganizer(registerData);

    expect(api.post).toHaveBeenCalledWith('/auth/register-organizer', registerData);
    expect(result).toEqual(mockResponse);
  });

  it('should call registerParticipant correctly', async () => {
    const registerData = { 
      email: 'participant@example.com', 
      password: 'password123', 
      name: 'Participant Name' 
    };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await authService.registerParticipant(registerData);

    expect(api.post).toHaveBeenCalledWith('/auth/register-participant', registerData);
    expect(result).toEqual(mockResponse);
  });

  it('should call refresh correctly', async () => {
    const refreshToken = 'fake-refresh-token';
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const result = await authService.refresh(refreshToken);

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refresh_token: refreshToken });
    expect(result).toEqual(mockResponse);
  });

  it('should call changePasswordForced correctly', async () => {
    const newPassword = 'new-password-123';
    vi.mocked(api.post).mockResolvedValue(undefined);

    await authService.changePasswordForced(newPassword);

    expect(api.post).toHaveBeenCalledWith('/auth/change-password-forced', { newPassword });
  });
});
