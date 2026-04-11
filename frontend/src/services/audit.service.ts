import { api } from "@/lib/api";

export interface AuditLog {
  id: string;
  eventId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  payload?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export const auditService = {
  getLogsByEvent: async (eventId: string): Promise<AuditLog[]> => {
    return api.get<AuditLog[]>(`/events/${eventId}/audit`);
  },

  exportLogs: async (eventId: string): Promise<string> => {
    return api.get<string>(`/events/${eventId}/audit/export`);
  },
};
