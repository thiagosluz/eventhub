import { api } from '../lib/api';

export interface CheckinResponse {
  alreadyCheckedIn: boolean;
  attendanceId: string;
}

export interface RaffleWinner {
  registrationId: string;
  userName: string;
}

export interface RaffleResponse {
  winners: RaffleWinner[];
}

export const operationsService = {
  checkin: async (qrCodeToken: string, activityId?: string): Promise<CheckinResponse> => {
    return api.post<CheckinResponse>('/checkin', { qrCodeToken, activityId });
  },

  drawRaffle: async (eventId: string, activityId?: string, count: number = 1): Promise<RaffleResponse> => {
    return api.post<RaffleResponse>('/raffles', { eventId, activityId, count });
  },
};
