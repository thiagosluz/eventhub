import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activitiesService, CreateActivityDto, UpdateActivityDto } from '../activities.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
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

  const mockActivity = { id: '1', title: 'Activity 1' };
  const eventId = 'event-1';

  it('getActivitiesForEvent should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([mockActivity]);
    const result = await activitiesService.getActivitiesForEvent(eventId);
    expect(api.get).toHaveBeenCalledWith('/events/event-1/activities');
    expect(result).toEqual([mockActivity]);
  });

  it('createActivity should call API correctly', async () => {
    const data: CreateActivityDto = { title: 'New', startAt: '2023-11-20', endAt: '2023-11-20' };
    vi.mocked(api.post).mockResolvedValue(mockActivity);
    const result = await activitiesService.createActivity(eventId, data);
    expect(api.post).toHaveBeenCalledWith('/events/event-1/activities', data);
    expect(result).toEqual(mockActivity);
  });

  it('updateActivity should call API correctly', async () => {
    const data: UpdateActivityDto = { title: 'Updated' };
    vi.mocked(api.patch).mockResolvedValue(mockActivity);
    const result = await activitiesService.updateActivity('1', data);
    expect(api.patch).toHaveBeenCalledWith('/activities/1', data);
    expect(result).toEqual(mockActivity);
  });

  it('deleteActivity should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await activitiesService.deleteActivity('1');
    expect(api.delete).toHaveBeenCalledWith('/activities/1');
  });

  it('enrollInActivity should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue(mockActivity);
    await activitiesService.enrollInActivity('1');
    expect(api.post).toHaveBeenCalledWith('/activities/1/enroll', {});
  });

  it('unrollFromActivity should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await activitiesService.unrollFromActivity('1');
    expect(api.delete).toHaveBeenCalledWith('/activities/1/unroll');
  });

  it('getMyEnrollments should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await activitiesService.getMyEnrollments(eventId);
    expect(api.get).toHaveBeenCalledWith('/activities/my-enrollments/event-1');
  });

  it('listEnrollments should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await activitiesService.listEnrollments('1');
    expect(api.get).toHaveBeenCalledWith('/activities/1/enrollments');
  });

  it('confirmEnrollment should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await activitiesService.confirmEnrollment('1', 'enroll-1');
    expect(api.post).toHaveBeenCalledWith('/activities/1/enrollments/enroll-1/confirm', {});
  });
});
