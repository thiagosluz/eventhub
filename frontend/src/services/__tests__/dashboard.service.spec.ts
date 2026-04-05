import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService, DashboardStats } from '../dashboard.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats: DashboardStats = {
    totalRevenue: 100,
    totalRegistrations: 10,
    activeEvents: 2,
    ticketsSold: 5,
    recentActivities: [],
    eventSales: [],
    timeSeriesData: [],
  };

  it('getStats should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockStats);
    const result = await dashboardService.getStats();
    expect(api.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result).toEqual(mockStats);
  });
});
