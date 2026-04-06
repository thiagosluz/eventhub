import { api } from '../lib/api';
import { Activity, ActivityEnrollment } from '../types/event';

export interface SpeakerAssociationDto {
  speakerId: string;
  roleId?: string;
}

export interface CreateActivityDto {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  typeId?: string;
  requiresEnrollment?: boolean;
  requiresConfirmation?: boolean;
  confirmationDays?: number;
  speakers?: SpeakerAssociationDto[];
}

export type UpdateActivityDto = Partial<CreateActivityDto>;

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
  },
  
  enrollInActivity: async (activityId: string): Promise<Activity> => {
    return api.post<Activity>(`/activities/${activityId}/enroll`, {});
  },

  unrollFromActivity: async (activityId: string): Promise<void> => {
    return api.delete(`/activities/${activityId}/unroll`);
  },

  getMyEnrollments: async (eventId: string): Promise<(Activity & { isEnrolled: boolean, enrollmentStatus?: string })[]> => {
    return api.get<(Activity & { isEnrolled: boolean, enrollmentStatus?: string })[]>(`/activities/my-enrollments/${eventId}`);
  },

  listEnrollments: async (activityId: string): Promise<ActivityEnrollment[]> => {
    return api.get<ActivityEnrollment[]>(`/activities/${activityId}/enrollments`);
  },

  confirmEnrollment: async (activityId: string, enrollmentId: string): Promise<ActivityEnrollment> => {
    return api.post<ActivityEnrollment>(`/activities/${activityId}/enrollments/${enrollmentId}/confirm`, {});
  }
};
