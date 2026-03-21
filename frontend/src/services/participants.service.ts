import { Ticket } from "../types/event";
import { api } from "../lib/api";

export interface ParticipantDetail extends Participant {
  enrollments: unknown[];
  formResponses: unknown[];
  certificates: unknown[];
  history: unknown[];
}

export interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
  };
  tickets: Ticket[];
  createdAt: string;
}

export const participantsService = {
  list: async () => {
    return api.get<Participant[]>("/participants");
  },
  getDetail: async (id: string) => {
    return api.get<ParticipantDetail>(`/participants/${id}`);
  },
  exportCSV: async () => {
    return api.get<string>("/participants/export");
  }
};
