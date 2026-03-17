import { api } from '../lib/api';
import { Form } from '../types/event';

export const formsService = {
  getRegistrationForm: async (eventId: string): Promise<Form | null> => {
    return api.get<Form>(`/events/${eventId}/registration-form`);
  },

  saveRegistrationForm: async (eventId: string, data: unknown): Promise<Form> => {
    return api.post<Form>(`/events/${eventId}/registration-form`, data);
  }
};
