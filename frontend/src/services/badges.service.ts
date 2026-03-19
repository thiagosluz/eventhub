import api from './api';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  color: string;
  triggerRule: string;
  manualDeliveryMode?: 'SCAN' | 'UNIQUE_CODES' | 'GLOBAL_CODE';
  minRequirement?: number;
  claimCode?: string;
  event?: { name: string };
  isEarned?: boolean;
}

export interface BadgeClaimCode {
  id: string;
  badgeId: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
  user?: { name: string; email: string };
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
  },
  
  async claimBadge(id: string, claimCode: string): Promise<UserBadge> {
    const { data } = await api.post(`/badges/claim/${id}`, { claimCode });
    return data;
  },

  async awardByScan(id: string, ticketToken: string): Promise<UserBadge> {
    const { data } = await api.post(`/badges/${id}/award-scan`, { ticketToken });
    return data;
  },

  async getClaimCodes(id: string): Promise<BadgeClaimCode[]> {
    const { data } = await api.get(`/badges/${id}/claim-codes`);
    return data;
  }
};
