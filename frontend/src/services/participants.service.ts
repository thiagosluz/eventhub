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

export interface PaginatedParticipants {
  data: Participant[];
  total: number;
  page: number;
  limit: number;
}

export interface ListParticipantsParams {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: string;
}

export const participantsService = {
  list: async () => {
    return api.get<Participant[]>("/participants");
  },
  listPaginated: async (params: ListParticipantsParams = {}) => {
    const { page = 1, limit = 20, search, eventId } = params;
    return api.get<PaginatedParticipants>("/participants", {
      params: {
        page,
        limit,
        search: search || undefined,
        eventId: eventId || undefined,
      },
    });
  },
  getDetail: async (id: string) => {
    return api.get<ParticipantDetail>(`/participants/${id}`);
  },
  exportCSV: async () => {
    return api.get<string>("/participants/export");
  },
};
