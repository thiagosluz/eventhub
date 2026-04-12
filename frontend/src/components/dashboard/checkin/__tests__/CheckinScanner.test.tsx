import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CheckinScanner } from '../CheckinScanner';
import { operationsService } from '@/services/operations.service';
import { analyticsService } from '@/services/analytics.service';
import { eventsService } from '@/services/events.service';
import { activitiesService } from '@/services/activities.service';
import toast from 'react-hot-toast';

// Mock das dependências
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: class {
      start = vi.fn().mockResolvedValue({});
      stop = vi.fn().mockResolvedValue({});
    },
  };
});

vi.mock('@/services/operations.service', () => ({
  operationsService: {
    checkin: vi.fn(),
    undoCheckin: vi.fn(),
  },
}));

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getEventParticipants: vi.fn(),
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

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-1', name: 'Organizador' } }),
}));

vi.mock('@/utils/xp-toast', () => ({
  showXpGain: vi.fn(),
}));

// Mock do Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockParticipants = [
  { 
    id: 'p-1', 
    name: 'Thiago Silva', 
    email: 'thiago@example.com', 
    ticketType: 'VIP', 
    qrCodeToken: 'TOKEN-123',
    attendances: [] 
  },
  { 
    id: 'p-2', 
    name: 'João Souza', 
    email: 'joao@example.com', 
    ticketType: 'FREE', 
    qrCodeToken: 'TOKEN-456',
    attendances: [{ id: 'att-1', activityId: null }] 
  },
];

describe('CheckinScanner', () => {
  const eventId = 'ev-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsService.getOrganizerEventById).mockResolvedValue({ id: eventId, name: 'Conferência' } as any);
    vi.mocked(activitiesService.getActivitiesForEvent).mockResolvedValue([]);
    vi.mocked(analyticsService.getEventParticipants).mockResolvedValue(mockParticipants as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve alternar entre abas Scanner e Manual', async () => {
    render(<CheckinScanner eventId={eventId} />);

    // Aba Scanner ativa por padrão
    expect(screen.getByText(/Scanner QR/i)).toHaveClass('text-primary');

    // Clica em Manual
    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    await waitFor(() => {
      expect(screen.getByText(/Manual \/ Busca/i)).toHaveClass('text-primary');
      expect(screen.getByPlaceholderText(/Busque por nome, email ou ingresso.../i)).toBeInTheDocument();
    });
  });

  it('deve filtrar participantes na busca manual', async () => {
    render(<CheckinScanner eventId={eventId} />);
    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    const searchInput = screen.getByPlaceholderText(/Busque por nome, email ou ingresso.../i);
    fireEvent.change(searchInput, { target: { value: 'João' } });
    
    // Espera o debounce de 500ms passar naturalmente
    await waitFor(() => {
      expect(analyticsService.getEventParticipants).toHaveBeenCalledWith(eventId, 'João', 20);
      expect(screen.getByText('João Souza')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('deve realizar check-in manual com sucesso', async () => {
    vi.mocked(operationsService.checkin).mockResolvedValue({ 
      alreadyCheckedIn: false, 
      attendanceId: 'att-new', 
      xpGained: 50 
    } as any);

    render(<CheckinScanner eventId={eventId} />);
    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    const searchInput = screen.getByPlaceholderText(/Busque por nome, email ou ingresso.../i);
    fireEvent.change(searchInput, { target: { value: 'Thiago' } });

    await waitFor(() => screen.getByText('Thiago Silva'), { timeout: 2000 });

    const checkinButtons = screen.getAllByText('CHECK-IN');
    fireEvent.click(checkinButtons[0]);

    await waitFor(() => {
      expect(operationsService.checkin).toHaveBeenCalledWith('TOKEN-123', undefined);
      expect(screen.getByText(/Check-in Sucesso!/i)).toBeInTheDocument();
    });
  });

  it('deve tratar erro 400 (ingresso já utilizado) no check-in manual', async () => {
    vi.mocked(operationsService.checkin).mockResolvedValue({ 
      alreadyCheckedIn: true, 
      attendanceId: 'att-old' 
    } as any);

    render(<CheckinScanner eventId={eventId} />);
    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    const searchInput = screen.getByPlaceholderText(/Busque por nome, email ou ingresso.../i);
    fireEvent.change(searchInput, { target: { value: 'Thiago' } });

    await waitFor(() => screen.getByText('Thiago Silva'), { timeout: 2000 });

    const checkinButton = screen.getAllByText('CHECK-IN')[0];
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(screen.getByText(/Já Realizado/i)).toBeInTheDocument();
    });
  });

  it('deve desfazer um check-in realizado', async () => {
    vi.mocked(operationsService.undoCheckin).mockResolvedValue({} as any);

    render(<CheckinScanner eventId={eventId} />);
    fireEvent.click(screen.getByText(/Manual \/ Busca/i));

    const searchInput = screen.getByPlaceholderText(/Busque por nome, email ou ingresso.../i);
    fireEvent.change(searchInput, { target: { value: 'João' } });

    await waitFor(() => screen.getByText('João Souza'), { timeout: 2000 });

    const undoButton = screen.getByText('DESFAZER');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(operationsService.undoCheckin).toHaveBeenCalledWith('att-1');
      expect(screen.getByText(/Desfeito!/i)).toBeInTheDocument();
    });
  });

  it('deve permitir selecionar atividade para check-in específico', async () => {
    vi.mocked(activitiesService.getActivitiesForEvent).mockResolvedValue([
      { id: 'act-1', title: 'Workshop de IA' }
    ] as any);

    render(<CheckinScanner eventId={eventId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Workshop de IA')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'act-1' } });

    expect(select).toHaveValue('act-1');
  });
});
