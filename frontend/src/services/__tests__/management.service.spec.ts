import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityTypesService, speakerRolesService } from '../management.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('management.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('activityTypesService', () => {
    it('list should call API correctly', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await activityTypesService.list();
      expect(api.get).toHaveBeenCalledWith('/activities/types');
    });

    it('create should call API correctly', async () => {
      vi.mocked(api.post).mockResolvedValue({ id: '1', name: 'Type 1' });
      await activityTypesService.create('Type 1');
      expect(api.post).toHaveBeenCalledWith('/activities/types', { name: 'Type 1' });
    });

    it('remove should call API correctly', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);
      await activityTypesService.remove('1');
      expect(api.delete).toHaveBeenCalledWith('/activities/types/1');
    });
  });

  describe('speakerRolesService', () => {
    it('list should call API correctly', async () => {
      vi.mocked(api.get).mockResolvedValue([]);
      await speakerRolesService.list();
      expect(api.get).toHaveBeenCalledWith('/speakers/roles');
    });

    it('create should call API correctly', async () => {
      vi.mocked(api.post).mockResolvedValue({ id: '1', name: 'Role 1' });
      await speakerRolesService.create('Role 1');
      expect(api.post).toHaveBeenCalledWith('/speakers/roles', { name: 'Role 1' });
    });

    it('remove should call API correctly', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);
      await speakerRolesService.remove('1');
      expect(api.delete).toHaveBeenCalledWith('/speakers/roles/1');
    });
  });
});
