import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participantsService } from '../participants.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('participantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await participantsService.list();
    expect(api.get).toHaveBeenCalledWith('/participants');
  });

  it('getDetail should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: '1' });
    await participantsService.getDetail('1');
    expect(api.get).toHaveBeenCalledWith('/participants/1');
  });

  it('exportCSV should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue('csv-data');
    await participantsService.exportCSV();
    expect(api.get).toHaveBeenCalledWith('/participants/export');
  });
});
