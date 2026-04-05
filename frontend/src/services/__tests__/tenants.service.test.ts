import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantsService } from '../tenants.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('tenantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMe deve buscar os dados do inquilino (tenant) atual', async () => {
    const mockData = { id: 't1', name: 'Tenant 1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await tenantsService.getMe();

    expect(api.get).toHaveBeenCalledWith('/tenants/me');
    expect(result).toEqual(mockData);
  });

  it('updateMe deve enviar PATCH para atualizar dados do tenant', async () => {
    const updateData = { name: 'Updated name' };
    (api.patch as any).mockResolvedValue({ id: 't1', ...updateData });

    const result = await tenantsService.updateMe(updateData);

    expect(api.patch).toHaveBeenCalledWith('/tenants/me', updateData);
    expect(result.name).toBe('Updated name');
  });

  it('getPublicTenant deve buscar dados públicos do inquilino', async () => {
    const mockData = { name: 'Public Tenant' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await tenantsService.getPublicTenant();

    expect(api.get).toHaveBeenCalledWith('/tenants/public/tenant');
    expect(result).toEqual(mockData);
  });
});
