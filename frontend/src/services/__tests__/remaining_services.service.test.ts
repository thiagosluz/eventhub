import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService } from '../checkout.service';
import { dashboardService } from '../dashboard.service';
import { formsService } from '../forms.service';
import { activityTypesService, speakerRolesService } from '../management.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('checkoutService', () => {
  it('processCheckout deve enviar POST para o checkout', async () => {
    const input = { eventId: 'ev1', activityIds: [] };
    (api.post as any).mockResolvedValue({ registrationId: 'r1' });
    const result = await checkoutService.processCheckout(input);
    expect(api.post).toHaveBeenCalledWith('/checkout', input);
    expect(result.registrationId).toBe('r1');
  });
});

describe('dashboardService', () => {
  it('getStats deve buscar estatísticas do dashboard', async () => {
    const mockData = { totalRevenue: 100 };
    (api.get as any).mockResolvedValue(mockData);
    const result = await dashboardService.getStats();
    expect(api.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result.totalRevenue).toBe(100);
  });
});

describe('formsService', () => {
  it('getRegistrationForm deve buscar formulário do evento', async () => {
    const mockData = { id: 'f1' };
    (api.get as any).mockResolvedValue(mockData);
    const result = await formsService.getRegistrationForm('ev1');
    expect(api.get).toHaveBeenCalledWith('/events/ev1/registration-form');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('f1');
  });

  it('saveRegistrationForm deve enviar POST com campos do formulário', async () => {
    const formData = { fields: [] };
    (api.post as any).mockResolvedValue(formData);
    await formsService.saveRegistrationForm('ev1', formData as any);
    expect(api.post).toHaveBeenCalledWith('/events/ev1/registration-form', formData);
  });
});

describe('management services', () => {
  describe('activityTypesService', () => {
    it('list deve listar tipos de atividade', async () => {
      const mockData = [{ id: 'at1', name: 'Workshop' }];
      (api.get as any).mockResolvedValue(mockData);
      const result = await activityTypesService.list();
      expect(api.get).toHaveBeenCalledWith('/activities/types');
      expect(result).toEqual(mockData);
    });

    it('create deve adicionar novo tipo de atividade', async () => {
        (api.post as any).mockResolvedValue({ id: 'at1', name: 'W' });
        await activityTypesService.create('W');
        expect(api.post).toHaveBeenCalledWith('/activities/types', { name: 'W' });
    });

    it('remove deve deletar tipo de atividade', async () => {
        (api.delete as any).mockResolvedValue(undefined);
        await activityTypesService.remove('at1');
        expect(api.delete).toHaveBeenCalledWith('/activities/types/at1');
    });
  });

  describe('speakerRolesService', () => {
    it('list deve listar cargos de palestrante', async () => {
      const mockData = [{ id: 'sr1', name: 'Keynote' }];
      (api.get as any).mockResolvedValue(mockData);
      const result = await speakerRolesService.list();
      expect(api.get).toHaveBeenCalledWith('/speakers/roles');
      expect(result).toEqual(mockData);
    });

    it('create deve adicionar novo cargo', async () => {
        (api.post as any).mockResolvedValue({ id: 'sr1', name: 'K' });
        await speakerRolesService.create('K');
        expect(api.post).toHaveBeenCalledWith('/speakers/roles', { name: 'K' });
    });

    it('remove deve deletar cargo', async () => {
        (api.delete as any).mockResolvedValue(undefined);
        await speakerRolesService.remove('sr1');
        expect(api.delete).toHaveBeenCalledWith('/speakers/roles/sr1');
    });
  });
});
