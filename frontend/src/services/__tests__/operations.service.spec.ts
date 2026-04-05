import { describe, it, expect, vi, beforeEach } from 'vitest';
import { operationsService } from '../operations.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
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

  const eventId = 'ev-1';

  it('checkin should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({ alreadyCheckedIn: false, attendanceId: 'a1' });
    await operationsService.checkin('qr-token', 'act-1');
    expect(api.post).toHaveBeenCalledWith('/checkin', { qrCodeToken: 'qr-token', activityId: 'act-1' });
  });

  it('drawRaffle should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({ winners: [] });
    await operationsService.drawRaffle(eventId, 'act-1', 1, 'ONLY_CHECKED_IN', 'Prize', true, true);
    expect(api.post).toHaveBeenCalledWith('/raffles', { 
      eventId, 
      activityId: 'act-1', 
      count: 1, 
      rule: 'ONLY_CHECKED_IN', 
      prizeName: 'Prize', 
      uniqueWinners: true, 
      excludeStaff: true 
    });
  });

  it('getLatestRaffle should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await operationsService.getLatestRaffle(eventId);
    expect(api.get).toHaveBeenCalledWith(`/raffles/latest/${eventId}`);
  });

  it('getRaffleHistory should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await operationsService.getRaffleHistory(eventId);
    expect(api.get).toHaveBeenCalledWith(`/raffles/history/${eventId}`);
  });

  it('deleteRaffleHistory should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await operationsService.deleteRaffleHistory('h1');
    expect(api.delete).toHaveBeenCalledWith('/raffles/history/h1');
  });

  it('markPrizeReceived should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    await operationsService.markPrizeReceived('h1', true);
    expect(api.post).toHaveBeenCalledWith('/raffles/history/h1/receive', { received: true });
  });

  it('setRaffleDisplayVisibility should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    await operationsService.setRaffleDisplayVisibility('h1', true);
    expect(api.post).toHaveBeenCalledWith('/raffles/history/h1/hide', { hide: true });
  });

  it('undoCheckin should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await operationsService.undoCheckin('att-1');
    expect(api.delete).toHaveBeenCalledWith('/checkin/att-1');
  });
});
