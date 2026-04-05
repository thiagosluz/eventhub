import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RaffleDisplayPage from '../page';
import { operationsService } from '@/services/operations.service';
import confetti from 'canvas-confetti';

// Mock das dependências
vi.mock('@/services/operations.service', () => ({
  operationsService: {
    getLatestRaffle: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ev-123' }),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  TrophyIcon: () => <div data-testid="TrophyIcon" />,
  SparklesIcon: () => <div data-testid="SparklesIcon" />,
}));

const mockRaffle = {
  id: 'r-1',
  prizeName: 'MacBook Pro',
  registration: { user: { name: 'Thiago Silva' } },
  isHiddenOnDisplay: false
};

describe('RaffleDisplayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('deve mostrar estado de espera quando não há sorteio', async () => {
    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue(null);

    render(<RaffleDisplayPage />);

    expect(await screen.findByText(/Aguardando sorteio.../i)).toBeInTheDocument();
  });

  it('deve mostrar o vencedor no primeiro carregamento', async () => {
    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue(mockRaffle as any);

    render(<RaffleDisplayPage />);

    expect(await screen.findByText('Thiago')).toBeInTheDocument();
    expect(screen.getByText(/MacBook Pro/i)).toBeInTheDocument();
  });

  it('deve disparar animação de suspense ao detectar novo sorteio', async () => {
    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue(mockRaffle as any);
    render(<RaffleDisplayPage />);

    expect(await screen.findByText('Thiago')).toBeInTheDocument();

    const newRaffle = {
      id: 'r-2',
      prizeName: 'iPhone 15',
      registration: { user: { name: 'Maria Souza' } },
      isHiddenOnDisplay: false
    };
    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue(newRaffle as any);

    // Espera pelo vencedor (com suspense acelerado no componente para 10ms)
    expect(await screen.findByText('Maria', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(confetti).toHaveBeenCalled();
  });

  it('deve ocultar o vencedor se isHiddenOnDisplay for true', async () => {
    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue(mockRaffle as any);
    render(<RaffleDisplayPage />);

    expect(await screen.findByText('Thiago')).toBeInTheDocument();

    vi.mocked(operationsService.getLatestRaffle).mockResolvedValue({
      ...mockRaffle,
      isHiddenOnDisplay: true
    } as any);

    // Espera pelo polling (acelerado no componente para 100ms)
    expect(await screen.findByText(/Aguardando sorteio.../i, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
