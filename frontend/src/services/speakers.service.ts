import { api } from '../lib/api';

export interface Speaker {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const speakersService = {
  getSpeakers: async (): Promise<Speaker[]> => {
    return api.get<Speaker[]>('/speakers');
  },

  getSpeakerById: async (id: string): Promise<Speaker> => {
    return api.get<Speaker>(`/speakers/${id}`);
  },

  createSpeaker: async (data: Partial<Speaker>): Promise<Speaker> => {
    return api.post<Speaker>('/speakers', data);
  },

  updateSpeaker: async (
    id: string,
    data: Partial<Speaker>,
  ): Promise<Speaker> => {
    return api.patch<Speaker>(`/speakers/${id}`, data);
  },

  deleteSpeaker: async (id: string): Promise<void> => {
    return api.delete(`/speakers/${id}`);
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string }>('/speakers/upload', formData);
  },
};
