import api from "./api";
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
  async getMe(): Promise<UserProfile> {
    const res = await api.get<UserProfile>("/users/me");
    return res.data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await api.patch<UserProfile>("/users/me", data);
    return res.data;
  },

  async updatePassword(data: any): Promise<{ message: string }> {
    const res = await api.patch("/users/me/password", data);
    return res.data;
  },

  async uploadAvatar(file: File): Promise<{ id: string; avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/users/me/avatar", formData);
    return res.data;
  },
};
