import { api } from '../lib/api';

export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
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

  createSpeaker: async (data: {
    name: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<Speaker> => {
    return api.post<Speaker>('/speakers', data);
  },

  updateSpeaker: async (
    id: string,
    data: { name?: string; bio?: string; avatarUrl?: string },
  ): Promise<Speaker> => {
    return api.patch<Speaker>(`/speakers/${id}`, data);
  },

  deleteSpeaker: async (id: string): Promise<void> => {
    return api.delete(`/speakers/${id}`);
  },
};
