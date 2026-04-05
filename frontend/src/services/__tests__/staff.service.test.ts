import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffService } from '../staff.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('staffService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-123';
  const userId = 'u-456';

  it('createOrganizer deve enviar POST para criar organizador', async () => {
    const orgData = { email: 'org@test.com', name: 'Org', temporaryPassword: 'tp' };
    (api.post as any).mockResolvedValue({ id: 'o1', ...orgData });

    const result = await staffService.createOrganizer(orgData);

    expect(api.post).toHaveBeenCalledWith('/staff/organizers', orgData);
    expect(result.name).toBe('Org');
  });

  it('listOrganizers deve buscar lista de organizadores', async () => {
    const mockData = [{ id: 'o1', name: 'Org' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await staffService.listOrganizers();

    expect(api.get).toHaveBeenCalledWith('/staff/organizers');
    expect(result).toEqual(mockData);
  });

  it('assignMonitor deve enviar POST para atribuir monitor ao evento', async () => {
    (api.post as any).mockResolvedValue({ id: 'm1' });

    const result = await staffService.assignMonitor(eventId, userId);

    expect(api.post).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors`, { userId });
    expect(result.id).toBe('m1');
  });

  it('removeMonitor deve enviar DELETE para desvincular monitor', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await staffService.removeMonitor(eventId, userId);

    expect(api.delete).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors/${userId}`);
  });

  it('listMonitors deve buscar monitores de um evento', async () => {
    const mockData = [{ id: 'm1', name: 'Mon' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await staffService.listMonitors(eventId);

    expect(api.get).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors`);
    expect(result).toEqual(mockData);
  });

  it('listPotentialMonitors deve buscar usuários qualificados para monitoria', async () => {
    const mockData = [{ id: 'u1', name: 'Pot' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await staffService.listPotentialMonitors(eventId);

    expect(api.get).toHaveBeenCalledWith(`/staff/events/${eventId}/potential-monitors`);
    expect(result).toEqual(mockData);
  });
});
