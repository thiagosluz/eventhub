import { apiClient } from '@/lib/api-client';

export interface EventModel {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  bannerUrl: string | null;
  logoUrl: string | null;
  themeConfig: Record<string, unknown> | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  // Included in public event detail
  activities?: Array<Record<string, unknown>>;
  forms?: Array<Record<string, unknown>>;
}

export const EventsService = {
  // ORGANIZER
  async createEvent(data: Partial<EventModel>) {
    const res = await apiClient.post<EventModel>('/events', data);
    return res.data;
  },
  
  async getTenantEvents() {
    const res = await apiClient.get<EventModel[]>('/events');
    return res.data;
  },

  async getEventById(id: string) {
    const res = await apiClient.get<EventModel>(`/events/${id}`);
    return res.data;
  },

  async updateEvent(id: string, data: Partial<EventModel>) {
    const res = await apiClient.patch<EventModel>(`/events/${id}`, data);
    return res.data;
  },

  async uploadBanner(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<EventModel>(`/events/${id}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async uploadLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<EventModel>(`/events/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // PUBLIC
  async getPublicEvents() {
    const res = await apiClient.get<EventModel[]>('/public/events');
    return res.data;
  },

  async getPublicEventBySlug(slug: string) {
    const res = await apiClient.get<EventModel>(`/public/events/${slug}`);
    return res.data;
  },

  // PARTICIPANT
  async getMyTickets() {
    // Ticket model depends on backend PR, using unknown for now
    const res = await apiClient.get<Record<string, unknown>[]>('/my-tickets');
    return res.data;
  }
};
