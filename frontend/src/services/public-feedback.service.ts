import { api } from '../lib/api';

export interface PublicActivityInfo {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  eventName: string;
  tenantName: string;
  tenantLogo?: string;
  speakers: {
    name: string;
    avatarUrl?: string;
  }[];
}

export interface SubmitFeedbackDto {
  rating: number;
  comment?: string;
}

export const publicFeedbackService = {
  getFeedbackInfo: async (activityId: string): Promise<PublicActivityInfo> => {
    return api.get<PublicActivityInfo>(`/public/activities/${activityId}/feedback-info`);
  },

  submitFeedback: async (activityId: string, data: SubmitFeedbackDto): Promise<void> => {
    return api.post(`/public/activities/${activityId}/feedbacks`, data);
  }
};
