import { api } from '../lib/api';
import { Submission, Review } from '../types/event';

export const submissionsService = {
  createSubmission: async (data: { 
    eventId: string; 
    title: string; 
    abstract?: string; 
    file: File 
  }): Promise<Submission> => {
    const formData = new FormData();
    formData.append('eventId', data.eventId);
    formData.append('title', data.title);
    if (data.abstract) formData.append('abstract', data.abstract);
    formData.append('file', data.file);

    return api.post<Submission>('/submissions', formData);
  },

  listMyReviews: async (): Promise<Review[]> => {
    return api.get<Review[]>('/me/reviews');
  },

  submitReview: async (data: {
    submissionId: string;
    score: number;
    recommendation: string;
    comments: string;
  }): Promise<Review> => {
    return api.post<Review>('/reviews', data);
  },

  listSubmissionsForEvent: async (eventId: string): Promise<Submission[]> => {
    return api.get<Submission[]>(`/events/${eventId}/submissions`);
  },
};
