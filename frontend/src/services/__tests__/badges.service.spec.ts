import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badgesService } from '../badges.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('badgesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const badgeId = 'badge-1';
  const eventId = 'ev-1';

  it('getMyBadges should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await badgesService.getMyBadges();
    expect(api.get).toHaveBeenCalledWith('/badges/my');
  });

  it('getAvailableBadges should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await badgesService.getAvailableBadges();
    expect(api.get).toHaveBeenCalledWith('/badges/available');
  });

  it('getEventBadges should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await badgesService.getEventBadges(eventId);
    expect(api.get).toHaveBeenCalledWith(`/badges/event/${eventId}`);
  });

  it('createBadge should call API correctly', async () => {
    const data = { name: 'New Badge' };
    vi.mocked(api.post).mockResolvedValue({});
    await badgesService.createBadge(eventId, data);
    expect(api.post).toHaveBeenCalledWith(`/badges/event/${eventId}`, data);
  });

  it('updateBadge should call API correctly', async () => {
    const data = { name: 'Updated name' };
    vi.mocked(api.patch).mockResolvedValue({});
    await badgesService.updateBadge(badgeId, data);
    expect(api.patch).toHaveBeenCalledWith(`/badges/${badgeId}`, data);
  });

  it('deleteBadge should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await badgesService.deleteBadge(badgeId);
    expect(api.delete).toHaveBeenCalledWith(`/badges/${badgeId}`);
  });

  it('claimBadge should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await badgesService.claimBadge(badgeId, 'CODE123');
    expect(api.post).toHaveBeenCalledWith(`/badges/claim/${badgeId}`, { claimCode: 'CODE123' });
  });

  it('awardByScan should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await badgesService.awardByScan(badgeId, 'TOKEN123');
    expect(api.post).toHaveBeenCalledWith(`/badges/${badgeId}/award-scan`, { ticketToken: 'TOKEN123' });
  });

  it('getClaimCodes should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await badgesService.getClaimCodes(badgeId);
    expect(api.get).toHaveBeenCalledWith(`/badges/${badgeId}/claim-codes`);
  });
});
