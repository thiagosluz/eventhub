import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantsService, UpdateTenantDto } from '../tenants.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('tenantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTenant = { id: '1', name: 'Tenant 1', slug: 'tenant-1' };

  it('getMe should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockTenant);
    const result = await tenantsService.getMe();
    expect(api.get).toHaveBeenCalledWith('/tenants/me');
    expect(result).toEqual(mockTenant);
  });

  it('updateMe should call API correctly', async () => {
    const data: UpdateTenantDto = { name: 'New Name' };
    vi.mocked(api.patch).mockResolvedValue({ ...mockTenant, ...data });
    const result = await tenantsService.updateMe(data);
    expect(api.patch).toHaveBeenCalledWith('/tenants/me', data);
    expect(result.name).toBe('New Name');
  });

  it('getPublicTenant should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ name: 'Public Tenant' });
    const result = await tenantsService.getPublicTenant();
    expect(api.get).toHaveBeenCalledWith('/tenants/public/tenant');
    expect(result.name).toBe('Public Tenant');
  });
});
