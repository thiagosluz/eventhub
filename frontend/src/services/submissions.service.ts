import { api } from '../lib/api';
import { Submission, Review, SubmissionConfig, SubmissionModality, ThematicArea, SubmissionRule } from '../types/event';

export const submissionsService = {
  createSubmission: async (data: { 
    eventId: string; 
    title: string; 
    abstract?: string; 
    modalityId?: string;
    thematicAreaId?: string;
    file: File 
  }): Promise<Submission> => {
    const formData = new FormData();
    formData.append('eventId', data.eventId);
    formData.append('title', data.title);
    if (data.abstract) formData.append('abstract', data.abstract);
    if (data.modalityId) formData.append('modalityId', data.modalityId);
    if (data.thematicAreaId) formData.append('thematicAreaId', data.thematicAreaId);
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
  
  listMySubmissions: async (): Promise<Submission[]> => {
    return api.get<Submission[]>('/me/submissions');
  },

  // === Submission Config ===

  getSubmissionConfig: async (eventId: string): Promise<SubmissionConfig> => {
    return api.get<SubmissionConfig>(`/events/${eventId}/submissions/config`);
  },

  updateSubmissionConfig: async (eventId: string, data: {
    submissionsEnabled?: boolean;
    submissionStartDate?: string;
    submissionEndDate?: string;
    reviewStartDate?: string;
    reviewEndDate?: string;
    scientificCommitteeHead?: string;
    scientificCommitteeEmail?: string;
  }) => {
    return api.patch(`/events/${eventId}/submissions/config`, data);
  },

  // === Modalities ===

  createModality: async (eventId: string, data: { name: string; description?: string }, templateFile?: File): Promise<SubmissionModality> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (templateFile) formData.append('templateFile', templateFile);
    return api.post<SubmissionModality>(`/events/${eventId}/submissions/modalities`, formData);
  },

  deleteModality: async (eventId: string, modalityId: string) => {
    return api.delete(`/events/${eventId}/submissions/modalities/${modalityId}`);
  },

  // === Thematic Areas ===

  createThematicArea: async (eventId: string, data: { name: string }): Promise<ThematicArea> => {
    return api.post<ThematicArea>(`/events/${eventId}/submissions/thematic-areas`, data);
  },

  deleteThematicArea: async (eventId: string, areaId: string) => {
    return api.delete(`/events/${eventId}/submissions/thematic-areas/${areaId}`);
  },

  // === Rules ===

  createRule: async (eventId: string, title: string, file: File): Promise<SubmissionRule> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    return api.post<SubmissionRule>(`/events/${eventId}/submissions/rules`, formData);
  },

  deleteRule: async (eventId: string, ruleId: string) => {
    return api.delete(`/events/${eventId}/submissions/rules/${ruleId}`);
  },
};
