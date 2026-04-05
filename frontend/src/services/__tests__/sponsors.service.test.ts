import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sponsorsService } from '../sponsors.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
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

  const eventId = 'ev-123';
  const categoryId = 'cat-456';
  const sponsorId = 'sp-789';

  it('listCategories deve buscar categorias de patrocinadores do evento', async () => {
    const mockData = [{ id: categoryId, name: 'Gold' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await sponsorsService.listCategories(eventId);

    expect(api.get).toHaveBeenCalledWith(`/sponsors/categories/${eventId}`);
    expect(result).toEqual(mockData);
  });

  it('createCategory deve enviar POST para criar categoria', async () => {
    const catData = { name: 'Gold' };
    (api.post as any).mockResolvedValue({ id: categoryId, ...catData });

    const result = await sponsorsService.createCategory(eventId, catData);

    expect(api.post).toHaveBeenCalledWith(`/sponsors/categories/${eventId}`, catData);
    expect(result.id).toBe(categoryId);
  });

  it('updateCategory deve enviar PATCH para atualizar categoria', async () => {
    const catData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: categoryId, name: 'Updated' });

    const result = await sponsorsService.updateCategory(categoryId, catData);

    expect(api.patch).toHaveBeenCalledWith(`/sponsors/categories/${categoryId}`, catData);
    expect(result.name).toBe('Updated');
  });

  it('deleteCategory deve remover uma categoria', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await sponsorsService.deleteCategory(categoryId);

    expect(api.delete).toHaveBeenCalledWith(`/sponsors/categories/${categoryId}`);
  });

  it('createSponsor deve enviar POST para criar patrocinador', async () => {
    const sponsorData = { name: 'Sponsor 1' };
    (api.post as any).mockResolvedValue({ id: sponsorId, ...sponsorData });

    const result = await sponsorsService.createSponsor(sponsorData);

    expect(api.post).toHaveBeenCalledWith('/sponsors', sponsorData);
    expect(result.id).toBe(sponsorId);
  });

  it('updateSponsor deve enviar PATCH para atualizar patrocinador', async () => {
    const sponsorData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: sponsorId, name: 'Updated' });

    const result = await sponsorsService.updateSponsor(sponsorId, sponsorData);

    expect(api.patch).toHaveBeenCalledWith(`/sponsors/${sponsorId}`, sponsorData);
    expect(result.name).toBe('Updated');
  });

  it('deleteSponsor deve remover um patrocinador', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await sponsorsService.deleteSponsor(sponsorId);

    expect(api.delete).toHaveBeenCalledWith(`/sponsors/${sponsorId}`);
  });

  it('uploadLogo deve enviar FormData com arquivo', async () => {
    const mockData = { id: sponsorId, logoUrl: 'url' };
    const file = new File([''], 'logo.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue(mockData);

    const result = await sponsorsService.uploadLogo(sponsorId, file);

    expect(api.post).toHaveBeenCalledWith(`/sponsors/${sponsorId}/logo`, expect.any(FormData));
    expect(result.logoUrl).toBe('url');
  });

  it('listPublicSponsors deve buscar patrocinadores públicos pelo slug do evento', async () => {
    const mockData = [{ id: categoryId, sponsors: [] }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await sponsorsService.listPublicSponsors('test-slug');

    expect(api.get).toHaveBeenCalledWith('/sponsors/public/event/test-slug');
    expect(result).toEqual(mockData);
  });
});
