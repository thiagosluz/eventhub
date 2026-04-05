import { render, screen, fireEvent, waitFor, act } from '@/test-utils';
import { CheckinScanner } from '../CheckinScanner';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { operationsService } from '@/services/operations.service';
import { eventsService } from '@/services/events.service';
import { activitiesService } from '@/services/activities.service';
import { analyticsService } from '@/services/analytics.service';
import { showXpGain } from '@/utils/xp-toast';

// Mock de Html5Qrcode
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);

vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: vi.fn().mockImplementation(function (elementId: string) {
      this.elementId = elementId;
      this.start = mockStart;
      this.stop = mockStop;
    }),
  };
});

// Mock dos serviços
vi.mock('@/services/operations.service', () => ({
  operationsService: {
    checkin: vi.fn(),
    undoCheckin: vi.fn(),
  },
}));

vi.mock('@/services/events.service', () => ({
  eventsService: {
    getOrganizerEventById: vi.fn(),
  },
}));

vi.mock('@/services/activities.service', () => ({
  activitiesService: {
    getActivitiesForEvent: vi.fn(),
  },
}));

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getEventParticipants: vi.fn(),
  },
}));

vi.mock('@/utils/xp-toast', () => ({
  showXpGain: vi.fn(),
}));

describe('CheckinScanner Component', () => {
  const eventId = 'evt-123';
  const mockEvent = { id: eventId, name: 'Evento de Teste' };
  const mockActivities = [
    { id: 'act-1', title: 'Workshop A' },
    { id: 'act-2', title: 'Palestra B' },
  ];
  const mockParticipants = [
    { 
      id: 'p-1', 
      name: 'John Doe', 
      email: 'john@example.com', 
      ticketType: 'VIP', 
      qrCodeToken: 'token-123',
      attendances: [] 
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (eventsService.getOrganizerEventById as any).mockResolvedValue(mockEvent);
    (activitiesService.getActivitiesForEvent as any).mockResolvedValue(mockActivities);
    (analyticsService.getEventParticipants as any).mockResolvedValue(mockParticipants);
    mockStart.mockResolvedValue(undefined);
  });

  it('deve carregar dados iniciais do evento e iniciar o scanner', async () => {
    render(<CheckinScanner eventId={eventId} />);

    await waitFor(() => {
      expect(screen.getByText('Evento de Teste')).toBeInTheDocument();
      expect(screen.getByText('Workshop A')).toBeInTheDocument();
    });

    // O scanner deve ser iniciado
    expect(mockStart).toHaveBeenCalled();
  });

  it('deve processar um check-in com sucesso via scanner', async () => {
    (operationsService.checkin as any).mockResolvedValue({ 
      alreadyCheckedIn: false, 
      xpGained: 50, 
      isLevelUp: false 
    });

    let scanSuccessCallback: (text: string) => void = () => {};
    mockStart.mockImplementation((_cam, _cfg, success) => {
      scanSuccessCallback = success;
      return Promise.resolve();
    });

    render(<CheckinScanner eventId={eventId} />);

    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    // Simula leitura de QR Code
    await act(async () => {
      await scanSuccessCallback('valid-token');
    });

    expect(operationsService.checkin).toHaveBeenCalledWith('valid-token', undefined);
    
    await waitFor(() => {
      expect(screen.getByText(/Check-in Sucesso!/i)).toBeInTheDocument();
    });
  });

  it('deve tratar erro de check-in (ingresso inválido)', async () => {
    (operationsService.checkin as any).mockRejectedValue(new Error('Ingresso Inválido'));

    let scanSuccessCallback: (text: string) => void = () => {};
    mockStart.mockImplementation((_cam, _cfg, success) => {
      scanSuccessCallback = success;
      return Promise.resolve();
    });

    render(<CheckinScanner eventId={eventId} />);
    await waitFor(() => expect(mockStart).toHaveBeenCalled());

    await act(async () => {
      await scanSuccessCallback('bad-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Erro no Check-in')).toBeInTheDocument();
      expect(screen.getByText('Ingresso Inválido')).toBeInTheDocument();
    });
  });

  it('deve alternar para modo manual e permitir busca', async () => {
    render(<CheckinScanner eventId={eventId} />);
    
    // Aguarda carregar dados
    await waitFor(() => expect(screen.getByText('Evento de Teste')).toBeInTheDocument());

    const manualTab = screen.getByText(/Manual \/ Busca/i);
    fireEvent.click(manualTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Busque por nome/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('deve permitir realizar check-in manual', async () => {
    (operationsService.checkin as any).mockResolvedValue({ alreadyCheckedIn: false });
    
    render(<CheckinScanner eventId={eventId} />);
    await waitFor(() => expect(screen.getByText(/Manual \/ Busca/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const checkinBtn = screen.getByText('CHECK-IN');
    fireEvent.click(checkinBtn);

    expect(operationsService.checkin).toHaveBeenCalledWith('token-123', undefined);
    
    await waitFor(() => {
      expect(screen.getByText('Check-in Sucesso!')).toBeInTheDocument();
    });
  });

  it('deve permitir desfazer check-in manual', async () => {
    const participantWithAttendance = {
      ...mockParticipants[0],
      attendances: [{ id: 'att-1', activityId: null }]
    };
    (analyticsService.getEventParticipants as any).mockResolvedValue([participantWithAttendance]);
    (operationsService.undoCheckin as any).mockResolvedValue({});

    render(<CheckinScanner eventId={eventId} />);
    await waitFor(() => expect(screen.getByText(/Manual \/ Busca/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    await waitFor(() => expect(screen.getByText('DESFAZER')).toBeInTheDocument());

    const undoBtn = screen.getByText('DESFAZER');
    fireEvent.click(undoBtn);

    expect(operationsService.undoCheckin).toHaveBeenCalledWith('att-1');
    
    await waitFor(() => {
      expect(screen.getByText('Desfeito!')).toBeInTheDocument();
    });
  });
});
