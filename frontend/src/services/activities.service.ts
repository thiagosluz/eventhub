import { api } from '../lib/api';
import { Activity } from '../types/event';

export interface CreateActivityDto {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  speakerIds?: string[];
}

export interface UpdateActivityDto extends Partial<CreateActivityDto> {}

export const activitiesService = {
  getActivitiesForEvent: async (eventId: string): Promise<Activity[]> => {
    return api.get<Activity[]>(`/events/${eventId}/activities`);
  },

  createActivity: async (eventId: string, data: CreateActivityDto): Promise<Activity> => {
    return api.post<Activity>(`/events/${eventId}/activities`, data);
  },

  updateActivity: async (activityId: string, data: UpdateActivityDto): Promise<Activity> => {
    return api.patch<Activity>(`/activities/${activityId}`, data);
  },

  deleteActivity: async (activityId: string): Promise<void> => {
    return api.delete(`/activities/${activityId}`);
  }
};
