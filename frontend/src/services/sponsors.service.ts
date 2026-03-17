import api from "./api";

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
    const res = await api.get<SponsorCategory[]>(`/sponsors/categories/${eventId}`);
    return res.data;
  },

  async createCategory(eventId: string, data: Partial<SponsorCategory>): Promise<SponsorCategory> {
    const res = await api.post<SponsorCategory>(`/sponsors/categories/${eventId}`, data);
    return res.data;
  },

  async updateCategory(id: string, data: Partial<SponsorCategory>): Promise<SponsorCategory> {
    const res = await api.patch<SponsorCategory>(`/sponsors/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/sponsors/categories/${id}`);
  },

  // Sponsors
  async createSponsor(data: Partial<Sponsor>): Promise<Sponsor> {
    const res = await api.post<Sponsor>("/sponsors", data);
    return res.data;
  },

  async updateSponsor(id: string, data: Partial<Sponsor>): Promise<Sponsor> {
    const res = await api.patch<Sponsor>(`/sponsors/${id}`, data);
    return res.data;
  },

  async deleteSponsor(id: string): Promise<void> {
    await api.delete(`/sponsors/${id}`);
  },

  async uploadLogo(id: string, file: File): Promise<Sponsor> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<Sponsor>(`/sponsors/${id}/logo`, formData);
    return res.data;
  },

  // Public
  async listPublicSponsors(eventSlug: string): Promise<SponsorCategory[]> {
    const res = await api.get<SponsorCategory[]>(`/sponsors/public/event/${eventSlug}`);
    return res.data;
  },
};
