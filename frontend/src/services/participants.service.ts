import api from "./api";

export interface ParticipantDetail extends Participant {
  enrollments: any[];
  formResponses: any[];
  certificates: any[];
  history: any[];
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
  tickets: any[];
  createdAt: string;
}

export const participantsService = {
  list: async () => {
    const response = await api.get<Participant[]>("/participants");
    return response.data;
  },
  getDetail: async (id: string) => {
    const response = await api.get<ParticipantDetail>(`/participants/${id}`);
    return response.data;
  },
  exportCSV: async () => {
    const response = await api.get<string>("/participants/export", { responseType: 'text' });
    return response.data;
  }
};
