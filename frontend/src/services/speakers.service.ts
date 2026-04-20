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
  userId?: string | null;
}

export interface SpeakerSummary {
  totalActivities: number;
  totalEnrollments: number;
  averageRating: number | null;
}

export interface ActivitySpeaker {
  activityId: string;
  speakerId: string;
  roleId?: string;
  activity: {
    id: string;
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    location?: string;
    event: { name: string; slug: string };
    type?: { name: string };
    _count: { enrollments: number };
  };
  role?: { name: string };
}

export interface ActivityFeedback {
  id: string;
  activityId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  activity: { title: string };
}

export interface PaginatedFeedbacks {
  data: ActivityFeedback[];
  total: number;
  averageRating: number | null;
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

  getMe: async (): Promise<Speaker> => {
    return api.get<Speaker>('/speakers/me');
  },

  getMyActivities: async (): Promise<ActivitySpeaker[]> => {
    return api.get<ActivitySpeaker[]>('/speakers/me/activities');
  },

  getMySummary: async (): Promise<SpeakerSummary> => {
    return api.get<SpeakerSummary>('/speakers/me/summary');
  },

  getMyFeedbacks: async (filters: {
    activityId?: string;
    rating?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedFeedbacks> => {
    const params = new URLSearchParams();
    if (filters.activityId) params.append('activityId', filters.activityId);
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const queryString = params.toString();
    const url = queryString ? `/speakers/me/feedbacks?${queryString}` : '/speakers/me/feedbacks';

    return api.get<PaginatedFeedbacks>(url);
  },

  addActivityMaterial: async (
    activityId: string,
    data: { title: string; fileUrl: string; fileType?: string },
  ): Promise<{ id: string }> => {
    return api.post<{ id: string }>(`/speakers/me/activities/${activityId}/materials`, data);
  },

  removeActivityMaterial: async (
    activityId: string,
    materialId: string,
  ): Promise<void> => {
    return api.delete(`/speakers/me/activities/${activityId}/materials/${materialId}`);
  },
};
