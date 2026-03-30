import { api } from "@/lib/api";

export interface Organizer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Monitor {
  id: string;
  eventId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface PotentialMonitor {
  id: string;
  email: string;
  name: string;
}

export const staffService = {
  createOrganizer: (data: { email: string; name: string; temporaryPassword: string }) =>
    api.post<Organizer>("/staff/organizers", data),

  listOrganizers: () =>
    api.get<Organizer[]>("/staff/organizers"),

  assignMonitor: (eventId: string, userId: string) =>
    api.post<Monitor>(`/staff/events/${eventId}/monitors`, { userId }),

  removeMonitor: (eventId: string, userId: string) =>
    api.delete(`/staff/events/${eventId}/monitors/${userId}`),

  listMonitors: (eventId: string) =>
    api.get<Monitor[]>(`/staff/events/${eventId}/monitors`),

  listPotentialMonitors: (eventId: string) =>
    api.get<PotentialMonitor[]>(`/staff/events/${eventId}/potential-monitors`),
};
