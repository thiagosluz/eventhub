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

  getUsers: async (): Promise<User[]> => {
    return api.get<User[]>("/users");
  },
};
