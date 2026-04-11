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
  bio?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  coverUrl?: string;
}

export const tenantsService = {
  getMe: async (): Promise<Tenant> => {
    return api.get<Tenant>('/tenants/me');
  },

  getAllPublic: async (): Promise<(Tenant & { _count: { events: number } })[]> => {
    return api.get<(Tenant & { _count: { events: number } })[]>('/public/organizers');
  },

  getOnePublic: async (slug: string): Promise<Tenant & { users: any[], events: any[] }> => {
    return api.get<Tenant & { users: any[], events: any[] }>(`/public/organizers/${slug}`);
  },

  updateMe: async (data: UpdateTenantDto): Promise<Tenant> => {
    return api.patch<Tenant>('/tenants/me', data);
  },

  uploadLogo: async (file: File): Promise<Tenant> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Tenant>('/tenants/me/logo', formData);
  },

  uploadCover: async (file: File): Promise<Tenant> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Tenant>('/tenants/me/cover', formData);
  },

  getPublicTenant: async (): Promise<Tenant> => {
    return api.get<Tenant>('/tenants/public/tenant');
  },
};
