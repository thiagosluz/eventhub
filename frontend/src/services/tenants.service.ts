import { api } from '../lib/api';
import { Tenant } from '../types/event';

export interface UpdateTenantDto {
  name?: string;
  logoUrl?: string;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    [key: string]: unknown;
  };
}

export const tenantsService = {
  getMe: async (): Promise<Tenant & { themeConfig?: Record<string, unknown>, logoUrl?: string }> => {
    return api.get<Tenant & { themeConfig?: Record<string, unknown>, logoUrl?: string }>('/tenants/me');
  },

  updateMe: async (data: UpdateTenantDto): Promise<Tenant> => {
    return api.patch<Tenant>('/tenants/me', data);
  },

  getPublicTenant: async (): Promise<Tenant> => {
    return api.get<Tenant>('/tenants/public/tenant');
  },
};
