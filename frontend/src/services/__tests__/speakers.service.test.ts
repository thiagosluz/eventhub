import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speakersService } from '../speakers.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('speakersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSpeakers deve buscar lista de palestrantes', async () => {
    const mockData = [{ id: 's1', name: 'Speaker 1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await speakersService.getSpeakers();

    expect(api.get).toHaveBeenCalledWith('/speakers');
    expect(result).toEqual(mockData);
  });

  it('getSpeakerById deve buscar um palestrante pelo ID', async () => {
    const mockData = { id: 's1', name: 'Speaker 1' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await speakersService.getSpeakerById('s1');

    expect(api.get).toHaveBeenCalledWith('/speakers/s1');
    expect(result).toEqual(mockData);
  });

  it('createSpeaker deve enviar POST para criar palestrante', async () => {
    const speakerData = { name: 'New Speaker' };
    (api.post as any).mockResolvedValue({ id: 's1', ...speakerData });

    const result = await speakersService.createSpeaker(speakerData);

    expect(api.post).toHaveBeenCalledWith('/speakers', speakerData);
    expect(result.name).toBe('New Speaker');
  });

  it('updateSpeaker deve enviar PATCH para atualizar palestrante', async () => {
    const speakerData = { name: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: 's1', ...speakerData });

    const result = await speakersService.updateSpeaker('s1', speakerData);

    expect(api.patch).toHaveBeenCalledWith('/speakers/s1', speakerData);
    expect(result.name).toBe('Updated');
  });

  it('deleteSpeaker deve enviar DELETE para remover palestrante', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await speakersService.deleteSpeaker('s1');

    expect(api.delete).toHaveBeenCalledWith('/speakers/s1');
  });

  it('uploadAvatar deve enviar FormData com arquivo', async () => {
    const mockData = { url: 'url' };
    const file = new File([''], 'avatar.png', { type: 'image/png' });
    (api.post as any).mockResolvedValue(mockData);

    const result = await speakersService.uploadAvatar(file);

    expect(api.post).toHaveBeenCalledWith('/speakers/upload', expect.any(FormData));
    expect(result.url).toBe('url');
  });

  it('getMe deve buscar perfil do palestrante logado', async () => {
    const mockData = { id: 's1', name: 'Me' };
    (api.get as any).mockResolvedValue(mockData);

    const result = await speakersService.getMe();

    expect(api.get).toHaveBeenCalledWith('/speakers/me');
    expect(result).toEqual(mockData);
  });

  it('getMyActivities deve buscar as atividades vinculadas ao palestrante', async () => {
    const mockData = [{ activityId: 'a1', speakerId: 's1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await speakersService.getMyActivities();

    expect(api.get).toHaveBeenCalledWith('/speakers/me/activities');
    expect(result).toEqual(mockData);
  });

  it('getMyFeedbacks deve buscar feedbacks recebidos', async () => {
    const mockData = [{ id: 'f1', rating: 5 }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await speakersService.getMyFeedbacks();

    expect(api.get).toHaveBeenCalledWith('/speakers/me/feedbacks');
    expect(result).toEqual(mockData);
  });

  it('addActivityMaterial deve enviar POST com material de apoio', async () => {
    const materialData = { title: 'Material', fileUrl: 'url' };
    (api.post as any).mockResolvedValue({ id: 'm1' });

    const result = await speakersService.addActivityMaterial('a1', materialData);

    expect(api.post).toHaveBeenCalledWith('/speakers/me/activities/a1/materials', materialData);
    expect(result.id).toBe('m1');
  });
});
