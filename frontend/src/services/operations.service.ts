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

export interface RaffleHistoryItem {
  id: string;
  eventId: string;
  activityId?: string;
  prizeName: string;
  winners: RaffleWinner[];
  rule: string;
  hideOnDisplay: boolean;
  receivedAt?: string;
  createdAt: string;
}

export const operationsService = {
  checkin: async (qrCodeToken: string, activityId?: string): Promise<CheckinResponse> => {
    return api.post<CheckinResponse>('/checkin', { qrCodeToken, activityId });
  },

  drawRaffle: async (
    eventId: string, 
    activityId?: string, 
    count: number = 1,
    rule: 'ALL_REGISTERED' | 'ONLY_CHECKED_IN' = 'ONLY_CHECKED_IN',
    prizeName?: string,
    uniqueWinners?: boolean,
    excludeStaff?: boolean
  ): Promise<RaffleResponse> => {
    return api.post<RaffleResponse>('/raffles', { eventId, activityId, count, rule, prizeName, uniqueWinners, excludeStaff });
  },

  getLatestRaffle: async (eventId: string): Promise<RaffleWinner | null> => {
    return api.get<RaffleWinner | null>(`/raffles/latest/${eventId}`);
  },

  getRaffleHistory: async (eventId: string): Promise<RaffleHistoryItem[]> => {
    return api.get<RaffleHistoryItem[]>(`/raffles/history/${eventId}`);
  },

  deleteRaffleHistory: async (historyId: string): Promise<void> => {
    return api.delete(`/raffles/history/${historyId}`);
  },

  markPrizeReceived: async (historyId: string, received: boolean): Promise<void> => {
    return api.post(`/raffles/history/${historyId}/receive`, { received });
  },

  setRaffleDisplayVisibility: async (historyId: string, hide: boolean): Promise<void> => {
    return api.post(`/raffles/history/${historyId}/hide`, { hide });
  },

  undoCheckin: async (attendanceId: string): Promise<void> => {
    return api.delete(`/checkin/${attendanceId}`);
  },
};
