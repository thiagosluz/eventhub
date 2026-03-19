import api from './api';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  color: string;
  triggerRule: string;
  event?: { name: string };
  isEarned?: boolean;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  userId: string;
  event?: {
    name: string;
    slug: string;
  };
  earnedAt: string;
}

export const badgesService = {
  async getMyBadges(): Promise<UserBadge[]> {
    const response = await api.get('/badges/my');
    return response.data;
  },

  async getAvailableBadges(): Promise<Badge[]> {
    const response = await api.get('/badges/available');
    return response.data;
  },

  async getEventBadges(eventId: string): Promise<Badge[]> {
    const { data } = await api.get(`/badges/event/${eventId}`);
    return data;
  },

  createBadge: async (eventId: string, badgeData: Partial<Badge>): Promise<Badge> => {
    const { data } = await api.post(`/badges/event/${eventId}`, badgeData);
    return data;
  },

  updateBadge: async (id: string, badgeData: Partial<Badge>): Promise<Badge> => {
    const { data } = await api.patch(`/badges/${id}`, badgeData);
    return data;
  },

  deleteBadge: async (id: string): Promise<void> => {
    await api.delete(`/badges/${id}`);
  }
};
