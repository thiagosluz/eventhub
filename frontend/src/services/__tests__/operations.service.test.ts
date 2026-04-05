import { describe, it, expect, vi, beforeEach } from 'vitest';
import { operationsService } from '../operations.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('operationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checkin deve realizar checkin de participante', async () => {
    const mockData = { alreadyCheckedIn: false, attendanceId: 'att-1' };
    (api.post as any).mockResolvedValue(mockData);

    const result = await operationsService.checkin('qr-token', 'act-1');

    expect(api.post).toHaveBeenCalledWith('/checkin', { qrCodeToken: 'qr-token', activityId: 'act-1' });
    expect(result).toEqual(mockData);
  });

  it('drawRaffle deve realizar um sorteio', async () => {
    const mockData = { winners: [{ registrationId: 'r1', userName: 'Winner' }] };
    (api.post as any).mockResolvedValue(mockData);

    const result = await operationsService.drawRaffle('ev-1', 'act-1', 2, 'ONLY_CHECKED_IN', 'Prize');

    expect(api.post).toHaveBeenCalledWith('/raffles', {
      eventId: 'ev-1',
      activityId: 'act-1',
      count: 2,
      rule: 'ONLY_CHECKED_IN',
      prizeName: 'Prize',
      uniqueWinners: undefined,
      excludeStaff: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it('getLatestRaffle deve buscar o último sorteio', async () => {
    const mockData = { id: 'r1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await operationsService.getLatestRaffle('ev-1');

    expect(api.get).toHaveBeenCalledWith('/raffles/latest/ev-1');
    expect(result).toEqual(mockData);
  });

  it('getRaffleHistory deve buscar o histórico de sorteios', async () => {
    const mockData = [{ id: 'h1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await operationsService.getRaffleHistory('ev-1');

    expect(api.get).toHaveBeenCalledWith('/raffles/history/ev-1');
    expect(result).toEqual(mockData);
  });

  it('deleteRaffleHistory deve deletar um registro do histórico', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await operationsService.deleteRaffleHistory('h123');

    expect(api.delete).toHaveBeenCalledWith('/raffles/history/h123');
  });

  it('markPrizeReceived deve marcar prêmio como recebido', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await operationsService.markPrizeReceived('h123', true);

    expect(api.post).toHaveBeenCalledWith('/raffles/history/h123/receive', { received: true });
  });

  it('setRaffleDisplayVisibility deve ocultar ou mostrar sorteio', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await operationsService.setRaffleDisplayVisibility('h123', true);

    expect(api.post).toHaveBeenCalledWith('/raffles/history/h123/hide', { hide: true });
  });

  it('undoCheckin deve desfazer o checkin', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await operationsService.undoCheckin('att-123');

    expect(api.delete).toHaveBeenCalledWith('/checkin/att-123');
  });
});
