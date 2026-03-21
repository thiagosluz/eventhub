import { api } from '../lib/api';

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
    return api.get('/badges/my');
  },

  async getAvailableBadges(): Promise<Badge[]> {
    return api.get('/badges/available');
  },

  async getEventBadges(eventId: string): Promise<Badge[]> {
    return api.get(`/badges/event/${eventId}`);
  },

  createBadge: async (eventId: string, badgeData: Partial<Badge>): Promise<Badge> => {
    return api.post(`/badges/event/${eventId}`, badgeData);
  },

  updateBadge: async (id: string, badgeData: Partial<Badge>): Promise<Badge> => {
    return api.patch(`/badges/${id}`, badgeData);
  },

  deleteBadge: async (id: string): Promise<void> => {
    await api.delete(`/badges/${id}`);
  },
  
  async claimBadge(id: string, claimCode: string): Promise<UserBadge> {
    return api.post(`/badges/claim/${id}`, { claimCode });
  },

  async awardByScan(id: string, ticketToken: string): Promise<UserBadge> {
    return api.post(`/badges/${id}/award-scan`, { ticketToken });
  },

  async getClaimCodes(id: string): Promise<BadgeClaimCode[]> {
    return api.get(`/badges/${id}/claim-codes`);
  }
};
