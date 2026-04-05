import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sponsorsService } from '../sponsors.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('sponsorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-1';
  const categoryId = 'cat-1';
  const sponsorId = 'sp-1';

  it('listCategories should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await sponsorsService.listCategories(eventId);
    expect(api.get).toHaveBeenCalledWith(`/sponsors/categories/${eventId}`);
  });

  it('createCategory should call API correctly', async () => {
    const data = { name: 'Gold' };
    vi.mocked(api.post).mockResolvedValue({});
    await sponsorsService.createCategory(eventId, data);
    expect(api.post).toHaveBeenCalledWith(`/sponsors/categories/${eventId}`, data);
  });

  it('updateCategory should call API correctly', async () => {
    const data = { name: 'Platinum' };
    vi.mocked(api.patch).mockResolvedValue({});
    await sponsorsService.updateCategory(categoryId, data);
    expect(api.patch).toHaveBeenCalledWith(`/sponsors/categories/${categoryId}`, data);
  });

  it('deleteCategory should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await sponsorsService.deleteCategory(categoryId);
    expect(api.delete).toHaveBeenCalledWith(`/sponsors/categories/${categoryId}`);
  });

  it('createSponsor should call API correctly', async () => {
    const data = { name: 'Sponsor 1' };
    vi.mocked(api.post).mockResolvedValue({});
    await sponsorsService.createSponsor(data);
    expect(api.post).toHaveBeenCalledWith('/sponsors', data);
  });

  it('updateSponsor should call API correctly', async () => {
    const data = { name: 'Updated name' };
    vi.mocked(api.patch).mockResolvedValue({});
    await sponsorsService.updateSponsor(sponsorId, data);
    expect(api.patch).toHaveBeenCalledWith(`/sponsors/${sponsorId}`, data);
  });

  it('deleteSponsor should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await sponsorsService.deleteSponsor(sponsorId);
    expect(api.delete).toHaveBeenCalledWith(`/sponsors/${sponsorId}`);
  });

  it('uploadLogo should call API correctly', async () => {
    const file = new File([''], 'logo.png');
    vi.mocked(api.post).mockResolvedValue({});
    await sponsorsService.uploadLogo(sponsorId, file);
    expect(api.post).toHaveBeenCalledWith(`/sponsors/${sponsorId}/logo`, expect.any(FormData));
  });

  it('listPublicSponsors should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await sponsorsService.listPublicSponsors('event-slug');
    expect(api.get).toHaveBeenCalledWith('/sponsors/public/event/event-slug');
  });
});
