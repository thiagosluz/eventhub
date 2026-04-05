import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventsService } from '../events.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('eventsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent = { id: '1', name: 'Event 1', slug: 'event-1' };

  it('getPublicEvents should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([mockEvent]);
    const result = await eventsService.getPublicEvents();
    expect(api.get).toHaveBeenCalledWith('/public/events');
    expect(result).toEqual([mockEvent]);
  });

  it('getPublicEventBySlug should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockEvent);
    const result = await eventsService.getPublicEventBySlug('event-1');
    expect(api.get).toHaveBeenCalledWith('/public/events/event-1');
  });

  it('getOrganizerEvents should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([mockEvent]);
    await eventsService.getOrganizerEvents();
    expect(api.get).toHaveBeenCalledWith('/events');
  });

  it('getOrganizerEventById should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockEvent);
    await eventsService.getOrganizerEventById('1');
    expect(api.get).toHaveBeenCalledWith('/events/1');
  });

  it('createEvent should call API correctly', async () => {
    const data = { name: 'New Event' };
    vi.mocked(api.post).mockResolvedValue(mockEvent);
    await eventsService.createEvent(data);
    expect(api.post).toHaveBeenCalledWith('/events', data);
  });

  it('updateEvent should call API correctly', async () => {
    const data = { name: 'Updated name' };
    vi.mocked(api.patch).mockResolvedValue(mockEvent);
    await eventsService.updateEvent('1', data);
    expect(api.patch).toHaveBeenCalledWith('/events/1', data);
  });

  it('uploadBanner should call API correctly', async () => {
    const file = new File([''], 'banner.jpg', { type: 'image/jpeg' });
    vi.mocked(api.post).mockResolvedValue(mockEvent);
    await eventsService.uploadBanner('1', file);
    expect(api.post).toHaveBeenCalledWith('/events/1/banner', expect.any(FormData));
  });

  it('uploadLogo should call API correctly', async () => {
    const file = new File([''], 'logo.jpg', { type: 'image/jpeg' });
    vi.mocked(api.post).mockResolvedValue(mockEvent);
    await eventsService.uploadLogo('1', file);
    expect(api.post).toHaveBeenCalledWith('/events/1/logo', expect.any(FormData));
  });

  it('getMyTickets should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await eventsService.getMyTickets();
    expect(api.get).toHaveBeenCalledWith('/my-tickets');
  });

  it('deleteEvent should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await eventsService.deleteEvent('1');
    expect(api.delete).toHaveBeenCalledWith('/events/1');
  });
});
