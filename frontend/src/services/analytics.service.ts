import { api } from "@/lib/api";

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalRegistrations: number;
  totalCheckins: number;
  activityParticipation: {
    id: string;
    name: string;
    type: string;
    enrolled: number;
    attended: number;
    capacity: number;
    occupancyRate: number;
  }[];
  registrationStatus: {
    name: string;
    value: number;
  }[];
  ticketDistribution: {
    name: string;
    value: number;
  }[];
  dailyRegistrations: {
    date: string;
    count: number;
  }[];
}

export interface Participant {
  id: string;
  userId: string;
  name: string;
  email: string;
  registrationDate: string;
  ticketType: string;
  ticketStatus: string;
  qrCodeToken?: string;
  attendances: { id: string; activityId: string | null }[];
  enrollmentsCount: number;
}

export interface Checkin {
  id: string;
  checkedAt: string;
  name: string;
  email: string;
  ticketType: string;
  activityName: string;
}

export const analyticsService = {
  getEventAnalytics: async (eventId: string): Promise<EventAnalytics> => {
    return api.get(`/analytics/events/${eventId}`);
  },

  getEventParticipants: async (eventId: string): Promise<Participant[]> => {
    return api.get(`/analytics/events/${eventId}/participants`);
  },

  getEventCheckins: async (eventId: string, activityId?: string): Promise<Checkin[]> => {
    return api.get(`/analytics/events/${eventId}/checkins`, {
      params: { activityId },
    });
  },
};
