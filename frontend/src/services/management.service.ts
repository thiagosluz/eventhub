import { api } from '../lib/api';

export interface ActivityType {
  id: string;
  name: string;
}

export const activityTypesService = {
  list: async (): Promise<ActivityType[]> => {
    return api.get<ActivityType[]>('/activities/types');
  },
  create: async (name: string): Promise<ActivityType> => {
    return api.post<ActivityType>('/activities/types', { name });
  },
  remove: async (id: string): Promise<void> => {
    return api.delete(`/activities/types/${id}`);
  }
};

export interface SpeakerRole {
  id: string;
  name: string;
}

export const speakerRolesService = {
  list: async (): Promise<SpeakerRole[]> => {
    return api.get<SpeakerRole[]>('/speakers/roles');
  },
  create: async (name: string): Promise<SpeakerRole> => {
    return api.post<SpeakerRole>('/speakers/roles', { name });
  },
  remove: async (id: string): Promise<void> => {
    return api.delete(`/speakers/roles/${id}`);
  }
};
