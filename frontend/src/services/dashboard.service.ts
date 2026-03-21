import { api } from "@/lib/api";

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
  timeSeriesData: {
    date: string;
    revenue: number;
    sales: number;
  }[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    return api.get("/dashboard/stats");
  },
};
