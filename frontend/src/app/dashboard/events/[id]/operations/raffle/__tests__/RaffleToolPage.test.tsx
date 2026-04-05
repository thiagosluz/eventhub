import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RaffleToolPage from '../page';
import { operationsService } from '@/services/operations.service';
import { eventsService } from '@/services/events.service';
import confetti from 'canvas-confetti';

// Mock das dependências
vi.mock('@/services/operations.service', () => ({
  operationsService: {
    drawRaffle: vi.fn(),
    getRaffleHistory: vi.fn(),
    markPrizeReceived: vi.fn(),
    setRaffleDisplayVisibility: vi.fn(),
    deleteRaffleHistory: vi.fn(),
  },
}));

vi.mock('@/services/events.service', () => ({
  eventsService: {
    getOrganizerEventById: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: () => <div />,
  ArrowPathIcon: () => <div />,
  TrophyIcon: () => <div />,
  UsersIcon: () => <div />,
  ArrowDownTrayIcon: () => <div />,
  ChevronLeftIcon: () => <div />,
  EyeIcon: () => <div />,
  EyeSlashIcon: () => <div />,
  TrashIcon: () => <div />,
  ExclamationTriangleIcon: () => <div />,
  XCircleIcon: () => <div />,
  ArrowLeftIcon: () => <div />,
  CheckIcon: () => <div />,
  XMarkIcon: () => <div />,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: () => <div />,
  TrophyIcon: () => <div />,
  SparklesIcon: () => <div />,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ev-123' }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockEvent = {
  id: 'ev-123',
  name: 'Conferência Tech',
  activities: [],
};

const mockHistory = [
  { 
    id: 'h-1', 
    prizeName: 'Voucher', 
    drawnAt: '2024-01-01T10:00:00Z',
    registration: { user: { name: 'Thiago Silva', email: 'thiago@example.com' } }, 
    hasReceived: false, 
    isHiddenOnDisplay: false 
  },
];

describe('RaffleToolPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.mocked(eventsService.getOrganizerEventById).mockResolvedValue(mockEvent as any);
    vi.mocked(operationsService.getRaffleHistory).mockResolvedValue(mockHistory as any);
  });

  it('deve carregar o evento e o histórico inicial', async () => {
    render(<RaffleToolPage />);

    expect(await screen.findByText('Conferência Tech', { exact: false })).toBeInTheDocument();
    expect(await screen.findByText('Thiago Silva')).toBeInTheDocument();
  });

  it('deve realizar um sorteio com sucesso', async () => {
    vi.mocked(operationsService.drawRaffle).mockResolvedValue({ 
      winners: [{ registrationId: 'reg-1', userName: 'Maria Vencedora' }] 
    } as any);

    render(<RaffleToolPage />);
    await screen.findByText('Conferência Tech', { exact: false });

    const drawButton = screen.getByText(/REALIZAR SORTEIO/i);
    fireEvent.click(drawButton);

    expect(await screen.findByText('Maria Vencedora', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(confetti).toHaveBeenCalled();
  });

  it('deve tratar erro quando não há participantes elegíveis', async () => {
    vi.mocked(operationsService.drawRaffle).mockRejectedValue(new Error('Nenhum participante elegível'));

    render(<RaffleToolPage />);
    await screen.findByText('Conferência Tech', { exact: false });

    const drawButton = screen.getByText(/REALIZAR SORTEIO/i);
    fireEvent.click(drawButton);

    expect(await screen.findByText(/Nenhum participante elegível/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('deve permitir gerenciar a entrega de prêmios', async () => {
    render(<RaffleToolPage />);
    expect(await screen.findByText('Thiago Silva')).toBeInTheDocument();

    const toggleButton = screen.getByText(/Pendente/i);
    fireEvent.click(toggleButton);

    expect(operationsService.markPrizeReceived).toHaveBeenCalledWith('h-1', true);
  });

  it('deve abrir modal de confirmação para excluir sorteio', async () => {
    render(<RaffleToolPage />);
    expect(await screen.findByText('Thiago Silva')).toBeInTheDocument();

    const deleteButton = screen.getByTitle(/Excluir/i);
    fireEvent.click(deleteButton);

    expect(await screen.findByText(/Excluir Histórico de Sorteio/i)).toBeInTheDocument();
  });
});
