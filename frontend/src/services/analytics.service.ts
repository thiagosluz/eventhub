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

export interface GamificationStats {
  totalXpDistributed: number;
  totalBadgesAwarded: number;
  activeAlertsCount: number;
  totalParticipants: number;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  globalLevel: number;
  eventXp: number;
}

export interface GamificationAlert {
  id: string;
  userId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
  user: { name: string; email: string };
}

export interface AwardedBadgeHistory {
  id: string;
  userId: string;
  badgeId: string;
  eventId: string;
  earnedAt: string;
  user: { name: string; email: string };
  badge: { name: string; iconUrl: string; color: string };
}

export const analyticsService = {
  getEventAnalytics: async (eventId: string): Promise<EventAnalytics> => {
    return api.get(`/analytics/events/${eventId}`);
  },

  getEventParticipants: async (
    eventId: string,
    search?: string,
    limit?: number,
  ): Promise<Participant[]> => {
    return api.get(`/analytics/events/${eventId}/participants`, {
      params: { search, limit },
    });
  },

  getEventCheckins: async (eventId: string, activityId?: string): Promise<Checkin[]> => {
    return api.get(`/analytics/events/${eventId}/checkins`, {
      params: { activityId },
    });
  },

  // --- Gamification ---
  getGamificationStats: async (eventId: string): Promise<GamificationStats> => {
    return api.get(`/analytics/events/${eventId}/gamification/stats`);
  },

  getGamificationRanking: async (eventId: string): Promise<RankingEntry[]> => {
    return api.get(`/analytics/events/${eventId}/gamification/ranking`);
  },

  getGamificationAlerts: async (eventId: string): Promise<GamificationAlert[]> => {
    return api.get(`/analytics/events/${eventId}/gamification/alerts`);
  },

  resolveAlert: async (alertId: string): Promise<void> => {
    return api.patch(`/analytics/gamification/alerts/${alertId}/resolve`);
  },

  getAwardedBadgesHistory: async (eventId: string): Promise<AwardedBadgeHistory[]> => {
    return api.get(`/analytics/events/${eventId}/gamification/badges-history`);
  },

  revokeBadge: async (userBadgeId: string): Promise<void> => {
    return api.delete(`/analytics/gamification/badges/${userBadgeId}/revoke`);
  },
};
