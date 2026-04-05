import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventsService } from '../events.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
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

  it('getPublicEvents deve buscar eventos públicos', async () => {
    const mockData = [{ id: 'ev-1', name: 'Public Event' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await eventsService.getPublicEvents();

    expect(api.get).toHaveBeenCalledWith('/public/events');
    expect(result).toEqual(mockData);
  });

  it('getPublicEventBySlug deve buscar evento público pelo slug', async () => {
    const mockData = { id: 'ev-1', name: 'Slug Event' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await eventsService.getPublicEventBySlug('test-slug');

    expect(api.get).toHaveBeenCalledWith('/public/events/test-slug');
    expect(result).toEqual(mockData);
  });

  it('getOrganizerEvents deve buscar eventos do organizador', async () => {
    const mockData = [{ id: 'ev-1', name: 'My Event' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await eventsService.getOrganizerEvents();

    expect(api.get).toHaveBeenCalledWith('/events');
    expect(result).toEqual(mockData);
  });

  it('getOrganizerEventById deve buscar evento do organizador pelo ID', async () => {
    const mockData = { id: 'ev-1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await eventsService.getOrganizerEventById('ev-1');

    expect(api.get).toHaveBeenCalledWith('/events/ev-1');
    expect(result).toEqual(mockData);
  });

  it('createEvent deve enviar POST para criar evento', async () => {
    const eventData = { name: 'New Event' };
    (api.post as any).mockResolvedValue({ id: 'ev-1', ...eventData });

    const result = await eventsService.createEvent(eventData);

    expect(api.post).toHaveBeenCalledWith('/events', eventData);
    expect(result.name).toBe('New Event');
  });

  it('updateEvent deve enviar PATCH para atualizar evento', async () => {
    const eventData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: 'ev-1', ...eventData });

    const result = await eventsService.updateEvent('ev-1', eventData);

    expect(api.patch).toHaveBeenCalledWith('/events/ev-1', eventData);
    expect(result.name).toBe('Updated');
  });

  it('uploadBanner deve enviar FormData para upload de banner', async () => {
    const mockData = { id: 'ev-1' };
    const file = new File([''], 'banner.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue(mockData);

    const result = await eventsService.uploadBanner('ev-1', file);

    expect(api.post).toHaveBeenCalledWith(
      '/events/ev-1/banner',
      expect.any(FormData)
    );
    expect(result).toEqual(mockData);
  });

  it('uploadLogo deve enviar FormData para upload de logo', async () => {
    const mockData = { id: 'ev-1' };
    const file = new File([''], 'logo.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue(mockData);

    const result = await eventsService.uploadLogo('ev-1', file);

    expect(api.post).toHaveBeenCalledWith(
      '/events/ev-1/logo',
      expect.any(FormData)
    );
    expect(result).toEqual(mockData);
  });

  it('getMyTickets deve buscar os ingressos do usuário', async () => {
    const mockData = [{ id: 'tk-1', event: { name: 'Event' } }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await eventsService.getMyTickets();

    expect(api.get).toHaveBeenCalledWith('/my-tickets');
    expect(result).toEqual(mockData);
  });

  it('deleteEvent deve remover um evento', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await eventsService.deleteEvent('ev-1');

    expect(api.delete).toHaveBeenCalledWith('/events/ev-1');
  });
});
