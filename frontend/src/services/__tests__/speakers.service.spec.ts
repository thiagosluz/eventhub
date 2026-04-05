import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speakersService } from '../speakers.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
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

  const mockSpeaker = { id: '1', name: 'Speaker 1' };

  it('getSpeakers should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([mockSpeaker]);
    await speakersService.getSpeakers();
    expect(api.get).toHaveBeenCalledWith('/speakers');
  });

  it('getSpeakerById should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockSpeaker);
    await speakersService.getSpeakerById('1');
    expect(api.get).toHaveBeenCalledWith('/speakers/1');
  });

  it('createSpeaker should call API correctly', async () => {
    const data = { name: 'New Speaker' };
    vi.mocked(api.post).mockResolvedValue(mockSpeaker);
    await speakersService.createSpeaker(data);
    expect(api.post).toHaveBeenCalledWith('/speakers', data);
  });

  it('updateSpeaker should call API correctly', async () => {
    const data = { name: 'Updated' };
    vi.mocked(api.patch).mockResolvedValue(mockSpeaker);
    await speakersService.updateSpeaker('1', data);
    expect(api.patch).toHaveBeenCalledWith('/speakers/1', data);
  });

  it('deleteSpeaker should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await speakersService.deleteSpeaker('1');
    expect(api.delete).toHaveBeenCalledWith('/speakers/1');
  });

  it('uploadAvatar should call API correctly', async () => {
    const file = new File([''], 'avatar.png');
    vi.mocked(api.post).mockResolvedValue({ url: 'url' });
    await speakersService.uploadAvatar(file);
    expect(api.post).toHaveBeenCalledWith('/speakers/upload', expect.any(FormData));
  });

  it('getMe should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue(mockSpeaker);
    await speakersService.getMe();
    expect(api.get).toHaveBeenCalledWith('/speakers/me');
  });

  it('getMyActivities should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await speakersService.getMyActivities();
    expect(api.get).toHaveBeenCalledWith('/speakers/me/activities');
  });

  it('getMyFeedbacks should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await speakersService.getMyFeedbacks();
    expect(api.get).toHaveBeenCalledWith('/speakers/me/feedbacks');
  });

  it('addActivityMaterial should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    const data = { title: 'M1', fileUrl: 'url' };
    await speakersService.addActivityMaterial('act-1', data);
    expect(api.post).toHaveBeenCalledWith('/speakers/me/activities/act-1/materials', data);
  });
});
