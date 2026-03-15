import { api } from '../lib/api';
import { Tenant } from '../types/event';

export interface UpdateTenantDto {
  name?: string;
  logoUrl?: string;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    [key: string]: any;
  };
}

export const tenantsService = {
  getMe: async (): Promise<Tenant & { themeConfig?: any, logoUrl?: string }> => {
    return api.get<Tenant & { themeConfig?: any, logoUrl?: string }>('/tenants/me');
  },

  updateMe: async (data: UpdateTenantDto): Promise<Tenant> => {
    return api.patch<Tenant>('/tenants/me', data);
  },
};
