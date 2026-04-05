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

  const eventId = 'ev-1';
  const userId = 'user-1';

  it('createOrganizer should call API correctly', async () => {
    const data = { email: 't@t.com', name: 'N', temporaryPassword: 'P' };
    vi.mocked(api.post).mockResolvedValue({});
    await staffService.createOrganizer(data);
    expect(api.post).toHaveBeenCalledWith('/staff/organizers', data);
  });

  it('listOrganizers should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await staffService.listOrganizers();
    expect(api.get).toHaveBeenCalledWith('/staff/organizers');
  });

  it('assignMonitor should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await staffService.assignMonitor(eventId, userId);
    expect(api.post).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors`, { userId });
  });

  it('removeMonitor should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await staffService.removeMonitor(eventId, userId);
    expect(api.delete).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors/${userId}`);
  });

  it('listMonitors should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await staffService.listMonitors(eventId);
    expect(api.get).toHaveBeenCalledWith(`/staff/events/${eventId}/monitors`);
  });

  it('listPotentialMonitors should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await staffService.listPotentialMonitors(eventId);
    expect(api.get).toHaveBeenCalledWith(`/staff/events/${eventId}/potential-monitors`);
  });
});
