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

  it('getMyBadges deve buscar medalhas do usuário atual', async () => {
    const mockData = [{ id: 'ub1', badgeId: 'b1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await badgesService.getMyBadges();

    expect(api.get).toHaveBeenCalledWith('/badges/my');
    expect(result).toEqual(mockData);
  });

  it('getAvailableBadges deve buscar medalhas disponíveis', async () => {
    const mockData = [{ id: 'b1', name: 'Badge 1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await badgesService.getAvailableBadges();

    expect(api.get).toHaveBeenCalledWith('/badges/available');
    expect(result).toEqual(mockData);
  });

  it('getEventBadges deve buscar medalhas de um evento', async () => {
    const mockData = [{ id: 'b1', name: 'Badge 1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await badgesService.getEventBadges('ev-1');

    expect(api.get).toHaveBeenCalledWith('/badges/event/ev-1');
    expect(result).toEqual(mockData);
  });

  it('createBadge deve criar uma nova medalha', async () => {
    const badgeData = { name: 'New Badge' };
    (api.post as any).mockResolvedValue({ id: 'b1', ...badgeData });

    const result = await badgesService.createBadge('ev-1', badgeData);

    expect(api.post).toHaveBeenCalledWith('/badges/event/ev-1', badgeData);
    expect(result.name).toBe('New Badge');
  });

  it('updateBadge deve atualizar uma medalha existente', async () => {
    const badgeData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: 'b1', ...badgeData });

    const result = await badgesService.updateBadge('b1', badgeData);

    expect(api.patch).toHaveBeenCalledWith('/badges/b1', badgeData);
    expect(result.name).toBe('Updated');
  });

  it('deleteBadge deve remover uma medalha', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await badgesService.deleteBadge('b1');

    expect(api.delete).toHaveBeenCalledWith('/badges/b1');
  });

  it('claimBadge deve resgatar uma medalha via código', async () => {
    (api.post as any).mockResolvedValue({ id: 'ub1' });

    const result = await badgesService.claimBadge('b1', 'CODE123');

    expect(api.post).toHaveBeenCalledWith('/badges/claim/b1', { claimCode: 'CODE123' });
    expect(result.id).toBe('ub1');
  });

  it('awardByScan deve atribuir medalha via scan de ticket', async () => {
    (api.post as any).mockResolvedValue({ id: 'ub1' });

    const result = await badgesService.awardByScan('b1', 'TICKET-TOKEN');

    expect(api.post).toHaveBeenCalledWith('/badges/b1/award-scan', { ticketToken: 'TICKET-TOKEN' });
    expect(result.id).toBe('ub1');
  });

  it('getClaimCodes deve buscar os códigos de resgate de uma medalha', async () => {
    const mockData = [{ id: 'c1', code: 'ABC' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await badgesService.getClaimCodes('b1');

    expect(api.get).toHaveBeenCalledWith('/badges/b1/claim-codes');
    expect(result).toEqual(mockData);
  });
});
