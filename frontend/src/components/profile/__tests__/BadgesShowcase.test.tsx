import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadgesShowcase } from '../BadgesShowcase';
import { badgesService, Badge } from '@/services/badges.service';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Mock das dependências
vi.mock('@/services/badges.service', () => ({
  badgesService: {
    getAvailableBadges: vi.fn(),
    claimBadge: vi.fn(),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  TrophyIcon: () => <div data-testid="TrophyIcon" />,
  SparklesIcon: () => <div data-testid="SparklesIcon" />,
  ShareIcon: () => <div data-testid="ShareIcon" />,
  XMarkIcon: () => <div data-testid="XMarkIcon" />,
}));

vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn();
  (mockToast as any).success = vi.fn();
  (mockToast as any).error = vi.fn();
  (mockToast as any).custom = vi.fn();
  return { toast: mockToast };
});

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock do componente Badge3D para facilitar o teste unitário
vi.mock('../Badge3D', () => ({
  Badge3D: ({ name, description, isEarned, onClick }: any) => (
    <div data-testid="badge-item" onClick={onClick}>
      <span>{name}</span>
      <p>{description}</p>
      {isEarned ? 'EARNED' : 'LOCKED'}
    </div>
  ),
}));

// Mock de html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('fake-data-url'),
}));

const mockBadges: Badge[] = [
  {
    id: 'b-1',
    name: 'Pioneiro',
    description: 'Primeira inscrição',
    color: '#f00',
    isEarned: true,
    triggerRule: 'EARLY_BIRD',
    event: { name: 'Evento Teste' }
  },
  {
    id: 'b-2',
    name: 'Mestre do Código',
    description: 'Código Secreto',
    color: '#00f',
    isEarned: false,
    triggerRule: 'MANUAL',
    event: { name: 'DevConf' }
  }
];

describe('BadgesShowcase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(badgesService.getAvailableBadges).mockResolvedValue(mockBadges);
  });

  it('deve renderizar o estado de carregamento inicial', () => {
    // Para testar o loading, não resolvemos a promise imediatamente
    vi.mocked(badgesService.getAvailableBadges).mockReturnValue(new Promise(() => {}));
    render(<BadgesShowcase />);
    expect(screen.getByText(/Carregando Sala de Troféus/i)).toBeInTheDocument();
  });

  it('deve carregar e listar as medalhas conquistadas e pendentes', async () => {
    render(<BadgesShowcase />);

    await waitFor(() => {
      expect(screen.getByText(/Gabinete de Conquistas/i)).toBeInTheDocument();
    });

    // Verifica badge conquistada
    expect(screen.getByText('Pioneiro')).toBeInTheDocument();
    expect(screen.getByText('EARNED')).toBeInTheDocument();

    // Verifica badge pendente
    expect(screen.getByText('Mestre do Código')).toBeInTheDocument();
    expect(screen.getByText('LOCKED')).toBeInTheDocument();
    expect(screen.getByText(/Clique para resgatar/i)).toBeInTheDocument();
  });

  it('deve abrir o modal de celebração ao clicar em uma medalha conquistada', async () => {
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Pioneiro'));

    const earnedBadge = screen.getByText('Pioneiro');
    fireEvent.click(earnedBadge);

    expect(confetti).toHaveBeenCalled();
    expect(screen.getByText(/Conquista Desbloqueada/i)).toBeInTheDocument();
    expect(screen.getByText(/Parabéns!/i)).toBeInTheDocument();
  });

  it('deve abrir o modal de resgate ao clicar em uma medalha MANUAL pendente', async () => {
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Mestre do Código'));

    const manualBadge = screen.getByText('Mestre do Código');
    fireEvent.click(manualBadge);

    expect(screen.getByText(/Resgatar Conquista/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/CÓDIGO SECRETO/i)).toBeInTheDocument();
  });

  it('deve resgatar uma medalha com sucesso via código', async () => {
    vi.mocked(badgesService.claimBadge).mockResolvedValue({ success: true } as any);
    
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Mestre do Código'));

    fireEvent.click(screen.getByText('Mestre do Código'));
    
    const input = screen.getByPlaceholderText(/CÓDIGO SECRETO/i);
    fireEvent.change(input, { target: { value: 'TEST123' } });
    
    const submitBtn = screen.getByRole('button', { name: /Desbloquear/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(badgesService.claimBadge).toHaveBeenCalledWith('b-2', 'TEST123');
      expect(toast.success).toHaveBeenCalledWith('Conquista desbloqueada!');
      expect(confetti).toHaveBeenCalled();
    });
  });

  it('deve mostrar erro ao inserir código inválido', async () => {
    vi.mocked(badgesService.claimBadge).mockRejectedValue({
      response: { data: { message: 'Código INVÁLIDO' } }
    });
    
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Mestre do Código'));

    fireEvent.click(screen.getByText('Mestre do Código'));
    fireEvent.change(screen.getByPlaceholderText(/CÓDIGO SECRETO/i), { target: { value: 'ERRO' } });
    fireEvent.click(screen.getByRole('button', { name: /Desbloquear/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Código INVÁLIDO');
    });
  });

  it('deve fechar o modal de resgate ao clicar em cancelar', async () => {
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Mestre do Código'));
    fireEvent.click(screen.getByText('Mestre do Código'));
    
    expect(screen.getByText(/Resgatar Conquista/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByText(/Resgatar Conquista/i)).not.toBeInTheDocument();
  });

  it('deve permitir baixar a medalha no modal de celebração', async () => {
    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Pioneiro'));
    fireEvent.click(screen.getByText('Pioneiro'));

    const downloadBtn = screen.getByRole('button', { name: /Baixar Medalha/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Imagem baixada!');
    });
  });

  it('deve mostrar mensagem secreta para medalhas com regra desconhecida', async () => {
    vi.mocked(badgesService.getAvailableBadges).mockResolvedValue([
      { ...mockBadges[1], triggerRule: 'OTHER' as any, isEarned: false }
    ]);

    render(<BadgesShowcase />);
    await waitFor(() => screen.getByText('Mestre do Código'));

    fireEvent.click(screen.getByText('Mestre do Código'));
    
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('Esta conquista é secreta'),
      expect.objectContaining({ icon: "🤫" })
    );
  });
});
