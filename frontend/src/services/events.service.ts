import { api } from '../lib/api';
import { Event, Ticket } from '../types/event';

export const eventsService = {
  getPublicEvents: async (): Promise<Event[]> => {
    return api.get<Event[]>('/public/events');
  },

  getPublicEventBySlug: async (slug: string): Promise<Event> => {
    return api.get<Event>(`/public/events/${slug}`);
  },

  getOrganizerEvents: async (): Promise<Event[]> => {
    return api.get<Event[]>('/events');
  },

  getOrganizerEventById: async (id: string): Promise<Event> => {
    return api.get<Event>(`/events/${id}`);
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    return api.post<Event>('/events', data);
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    return api.patch<Event>(`/events/${id}`, data);
  },

  uploadBanner: async (id: string, file: File): Promise<Event> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Event>(`/events/${id}/banner`, formData);
  },

  uploadLogo: async (id: string, file: File): Promise<Event> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Event>(`/events/${id}/logo`, formData);
  },

  getMyTickets: async (): Promise<Ticket[]> => {
    return api.get<Ticket[]>('/my-tickets');
  },
};
