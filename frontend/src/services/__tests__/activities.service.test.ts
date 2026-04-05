import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activitiesService } from '../activities.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('activitiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-123';
  const activityId = 'act-456';

  it('getActivitiesForEvent deve buscar atividades do evento', async () => {
    const mockData = [{ id: activityId, title: 'Test Activity' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await activitiesService.getActivitiesForEvent(eventId);

    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/activities`);
    expect(result).toEqual(mockData);
  });

  it('createActivity deve enviar POST para criar atividade', async () => {
    const activityData = { title: 'New', startAt: '2024-01-01', endAt: '2024-01-02' };
    (api.post as any).mockResolvedValue({ id: activityId, ...activityData });

    const result = await activitiesService.createActivity(eventId, activityData as any);

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/activities`, activityData);
    expect(result.title).toBe('New');
  });

  it('updateActivity deve enviar PATCH para atualizar atividade', async () => {
    const activityData = { title: 'Updated' };
    (api.patch as any).mockResolvedValue({ id: activityId, ...activityData });

    const result = await activitiesService.updateActivity(activityId, activityData);

    expect(api.patch).toHaveBeenCalledWith(`/activities/${activityId}`, activityData);
    expect(result.title).toBe('Updated');
  });

  it('deleteActivity deve enviar DELETE para remover atividade', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await activitiesService.deleteActivity(activityId);

    expect(api.delete).toHaveBeenCalledWith(`/activities/${activityId}`);
  });

  it('enrollInActivity deve realizar inscrição do usuário', async () => {
    (api.post as any).mockResolvedValue({ id: activityId });

    const result = await activitiesService.enrollInActivity(activityId);

    expect(api.post).toHaveBeenCalledWith(`/activities/${activityId}/enroll`, {});
    expect(result.id).toBe(activityId);
  });

  it('unrollFromActivity deve remover inscrição do usuário', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await activitiesService.unrollFromActivity(activityId);

    expect(api.delete).toHaveBeenCalledWith(`/activities/${activityId}/unroll`);
  });

  it('getMyEnrollments deve buscar inscrições do usuário no evento', async () => {
    const mockData = [{ id: activityId, title: 'My Activity', isEnrolled: true }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await activitiesService.getMyEnrollments(eventId);

    expect(api.get).toHaveBeenCalledWith(`/activities/my-enrollments/${eventId}`);
    expect(result).toEqual(mockData);
  });

  it('listEnrollments deve listar inscrições de uma atividade', async () => {
    const mockData = [{ id: 'e1', userId: 'u1' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await activitiesService.listEnrollments(activityId);

    expect(api.get).toHaveBeenCalledWith(`/activities/${activityId}/enrollments`);
    expect(result).toEqual(mockData);
  });

  it('confirmEnrollment deve confirmar inscrição de um participante', async () => {
    (api.post as any).mockResolvedValue({ id: 'e1' });

    const result = await activitiesService.confirmEnrollment(activityId, 'e1');

    expect(api.post).toHaveBeenCalledWith(`/activities/${activityId}/enrollments/e1/confirm`, {});
    expect(result.id).toBe('e1');
  });
});
