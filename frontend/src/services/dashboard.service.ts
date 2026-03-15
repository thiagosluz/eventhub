import api from "@/services/api";

export interface DashboardStats {
  totalRevenue: number;
  totalRegistrations: number;
  activeEvents: number;
  ticketsSold: number;
  recentActivities: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    eventTitle?: string;
  }[];
  eventSales: {
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};
