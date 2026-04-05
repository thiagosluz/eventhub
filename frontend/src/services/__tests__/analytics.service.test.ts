import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../analytics.service';
import { api } from '@/lib/api';

// Mock do ApiClient
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

  const eventId = 'ev-123';

  it('getEventAnalytics deve buscar analytics do evento', async () => {
    const mockData = { eventId, eventName: 'Test Event' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getEventAnalytics(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}`);
    expect(result).toEqual(mockData);
  });

  it('getEventParticipants deve buscar participantes do evento', async () => {
    const mockData = [{ id: 'p1', name: 'John' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getEventParticipants(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/participants`);
    expect(result).toEqual(mockData);
  });

  it('getEventCheckins deve buscar checkins do evento', async () => {
    const mockData = [{ id: 'c1', name: 'John' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getEventCheckins(eventId, 'act-1');

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/checkins`, {
      params: { activityId: 'act-1' },
    });
    expect(result).toEqual(mockData);
  });

  it('getGamificationStats deve buscar estatísticas de gamificação', async () => {
    const mockData = { totalXpDistributed: 100 };
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getGamificationStats(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/stats`);
    expect(result).toEqual(mockData);
  });

  it('getGamificationRanking deve buscar ranking de gamificação', async () => {
    const mockData = [{ userId: 'u1', userName: 'User 1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getGamificationRanking(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/ranking`);
    expect(result).toEqual(mockData);
  });

  it('getGamificationAlerts deve buscar alertas de gamificação', async () => {
    const mockData = [{ id: 'a1', type: 'FARMING' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getGamificationAlerts(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/alerts`);
    expect(result).toEqual(mockData);
  });

  it('resolveAlert deve marcar alerta como resolvido', async () => {
    (api.patch as any).mockResolvedValue(undefined);

    await analyticsService.resolveAlert('a123');

    expect(api.patch).toHaveBeenCalledWith(`/analytics/gamification/alerts/a123/resolve`);
  });

  it('getAwardedBadgesHistory deve buscar histórico de medalhas', async () => {
    const mockData = [{ id: 'b1', badgeId: 'badge-1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await analyticsService.getAwardedBadgesHistory(eventId);

    expect(api.get).toHaveBeenCalledWith(`/analytics/events/${eventId}/gamification/badges-history`);
    expect(result).toEqual(mockData);
  });

  it('revokeBadge deve revogar uma medalha', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await analyticsService.revokeBadge('ub-123');

    expect(api.delete).toHaveBeenCalledWith(`/analytics/gamification/badges/ub-123/revoke`);
  });
});
