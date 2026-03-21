import { api } from '../lib/api';

export type SponsorSize = "SMALL" | "MEDIUM" | "LARGE";

export interface Sponsor {
  id: string;
  categoryId: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  displayOrder: number;
}

export interface SponsorCategory {
  id: string;
  eventId: string;
  name: string;
  displayOrder: number;
  size: SponsorSize;
  color?: string;
  sponsors: Sponsor[];
}

export const sponsorsService = {
  // Categories
  async listCategories(eventId: string): Promise<SponsorCategory[]> {
    return api.get<SponsorCategory[]>(`/sponsors/categories/${eventId}`);
  },

  async createCategory(eventId: string, data: Partial<SponsorCategory>): Promise<SponsorCategory> {
    return api.post<SponsorCategory>(`/sponsors/categories/${eventId}`, data);
  },

  async updateCategory(id: string, data: Partial<SponsorCategory>): Promise<SponsorCategory> {
    return api.patch<SponsorCategory>(`/sponsors/categories/${id}`, data);
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/sponsors/categories/${id}`);
  },

  // Sponsors
  async createSponsor(data: Partial<Sponsor>): Promise<Sponsor> {
    return api.post<Sponsor>("/sponsors", data);
  },

  async updateSponsor(id: string, data: Partial<Sponsor>): Promise<Sponsor> {
    return api.patch<Sponsor>(`/sponsors/${id}`, data);
  },

  async deleteSponsor(id: string): Promise<void> {
    await api.delete(`/sponsors/${id}`);
  },

  async uploadLogo(id: string, file: File): Promise<Sponsor> {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<Sponsor>(`/sponsors/${id}/logo`, formData);
  },

  // Public
  async listPublicSponsors(eventSlug: string): Promise<SponsorCategory[]> {
    return api.get<SponsorCategory[]>(`/sponsors/public/event/${eventSlug}`);
  },
};
