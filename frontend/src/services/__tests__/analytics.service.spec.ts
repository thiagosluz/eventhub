import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../analytics.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-1';

  it('getEventAnalytics should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await analyticsService.getEventAnalytics(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}`);
  });

  it('getEventParticipants should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await analyticsService.getEventParticipants(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/participants`, {
      params: { search: undefined, limit: undefined }
    });
  });

  it('getEventCheckins should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await analyticsService.getEventCheckins(eventId, 'act-1');
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/checkins`, { params: { activityId: 'act-1' } });
  });

  it('getGamificationStats should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await analyticsService.getGamificationStats(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/stats`);
  });

  it('getGamificationRanking should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await analyticsService.getGamificationRanking(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/ranking`);
  });

  it('getGamificationAlerts should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await analyticsService.getGamificationAlerts(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/alerts`);
  });

  it('resolveAlert should call API correctly', async () => {
    vi.mocked(api.patch).mockResolvedValue(undefined);
    await analyticsService.resolveAlert('alert-1');
    expect(api.patch).toHaveBeenCalledWith('/analytics/gamification/alerts/alert-1/resolve');
  });

  it('getAwardedBadgesHistory should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await analyticsService.getAwardedBadgesHistory(eventId);
    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/badges-history`);
  });

  it('revokeBadge should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await analyticsService.revokeBadge('badge-1');
    expect(api.delete).toHaveBeenCalledWith('/analytics/gamification/badges/badge-1/revoke');
  });
});
