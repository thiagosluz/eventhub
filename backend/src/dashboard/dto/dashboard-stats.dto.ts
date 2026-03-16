export class DashboardStatsDto {
  totalRevenue!: number;
  totalRegistrations!: number;
  activeEvents!: number;
  ticketsSold!: number;
  recentActivities!: {
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    eventTitle?: string;
  }[];
  eventSales!: {
    name: string;
    sales: number;
    revenue: number;
  }[];
  timeSeriesData!: {
    date: string;
    revenue: number;
    sales: number;
  }[];
}
