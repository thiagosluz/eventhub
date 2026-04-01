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

export const usersService = {
  getMe: async (): Promise<UserProfile> => {
    return api.get<UserProfile>("/users/me");
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    return api.patch<UserProfile>("/users/me", data);
  },

  updatePassword: async (data: any): Promise<{ message: string }> => {
    return api.patch("/users/me/password", data);
  },

  uploadAvatar: async (file: File): Promise<{ id: string; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/users/me/avatar", formData);
  },

  getPublicProfile: async (username: string): Promise<any> => {
    return api.get(`/users/p/${username}`);
  },

  getUsers: async (): Promise<User[]> => {
    return api.get<User[]>("/users");
  },

  getMonitoredEvents: async (): Promise<{ eventId: string; event: any }[]> => {
    return api.get<{ eventId: string; event: any }[]>("/users/me/monitored-events");
  },

  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    return api.get<{ available: boolean }>(`/users/check-username/${username}`);
  },

  getSpeakerProfile: async (id: string): Promise<any> => {
    return api.get(`/speakers/${id}`);
  },

  getMySpeakerProfile: async (): Promise<any> => {
    return api.get("/speakers/me");
  }
};
