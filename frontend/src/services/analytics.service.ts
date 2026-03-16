import api from "@/services/api";

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  activityParticipation: {
    id: string;
    name: string;
    type: string;
    enrolled: number;
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

export const analyticsService = {
  getEventAnalytics: async (eventId: string): Promise<EventAnalytics> => {
    const response = await api.get(`/analytics/events/${eventId}`);
    return response.data;
  },
};
