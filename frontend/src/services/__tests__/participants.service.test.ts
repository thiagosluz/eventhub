import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participantsService } from '../participants.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('participantsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list deve buscar a lista de participantes', async () => {
    const mockData = [{ id: 'p1', user: { name: 'John' } }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await participantsService.list();

    expect(api.get).toHaveBeenCalledWith('/participants');
    expect(result).toEqual(mockData);
  });

  it('getDetail deve buscar os detalhes de um participante', async () => {
    const mockData = { id: 'p1', enrollments: [] };
    (api.get as any).mockResolvedValue(mockData);

    const result = await participantsService.getDetail('p1');

    expect(api.get).toHaveBeenCalledWith('/participants/p1');
    expect(result).toEqual(mockData);
  });

  it('exportCSV deve buscar os dados para exportação', async () => {
    const mockData = 'id,name\n1,John';
    (api.get as any).mockResolvedValue(mockData);

    const result = await participantsService.exportCSV();

    expect(api.get).toHaveBeenCalledWith('/participants/export');
    expect(result).toBe(mockData);
  });
});
