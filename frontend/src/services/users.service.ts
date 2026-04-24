import { api } from "../lib/api";
import { User } from "../types/auth";

export interface UserProfile extends Omit<User, "tenantId"> {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  avatarUrl?: string;
  bio?: string;
  tenantId: string;
  username?: string;
  interests?: string[];
  profileTheme?: string;
  publicProfile?: boolean;
  xp?: number;
  coins?: number;
  level?: number;
  xpGained?: number;
  isLevelUp?: boolean;
}

export interface EventMonitored {
  eventId: string;
  event: {
    id: string;
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    bannerUrl?: string;
    status: string;
  };
}

export interface XpHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  eventId: string | null;
  eventName: string | null;
}

export interface PaginatedXpHistory {
  data: XpHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface SpeakerProfile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  expertise?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export const usersService = {
  getMe: async (): Promise<UserProfile> => {
    return api.get<UserProfile>("/users/me");
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    return api.patch<UserProfile>("/users/me", data);
  },

  updatePassword: async (data: Record<string, string>): Promise<{ message: string }> => {
    return api.patch("/users/me/password", data);
  },

  uploadAvatar: async (file: File): Promise<{ id: string; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/me/avatar", formData);
  },

  getPublicProfile: async (username: string): Promise<UserProfile> => {
    return api.get<UserProfile>(`/users/p/${username}`);
  },

  getUsers: async (): Promise<User[]> => {
    return api.get<User[]>("/users");
  },

  getMonitoredEvents: async (): Promise<EventMonitored[]> => {
    return api.get<EventMonitored[]>("/users/me/monitored-events");
  },

  getMyXpHistory: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<PaginatedXpHistory> => {
    const { page = 1, limit = 20 } = params;
    return api.get<PaginatedXpHistory>("/users/me/xp-history", {
      params: { page, limit },
    });
  },

  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    return api.get<{ available: boolean }>(`/users/check-username/${username}`);
  },

  getSpeakerProfile: async (id: string): Promise<SpeakerProfile> => {
    return api.get<SpeakerProfile>(`/speakers/${id}`);
  },

  getMySpeakerProfile: async (): Promise<SpeakerProfile> => {
    return api.get<SpeakerProfile>("/speakers/me");
  }
};
