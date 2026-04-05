import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formsService } from '../forms.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('formsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-1';

  it('getRegistrationForm should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 'f1' });
    await formsService.getRegistrationForm(eventId);
    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/registration-form`);
  });

  it('saveRegistrationForm should call API correctly', async () => {
    const data = { fields: [] };
    vi.mocked(api.post).mockResolvedValue({ id: 'f1' });
    await formsService.saveRegistrationForm(eventId, data);
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/registration-form`, data);
  });
});
