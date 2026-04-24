import { render, screen, fireEvent } from '@/test-utils';
import { ParticipantDetailDrawer } from '../ParticipantDetailDrawer';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ParticipantDetailDrawer Component', () => {
  const mockParticipant = {
    id: 'part-1',
    user: {
      name: 'Ana Participante',
      email: 'ana@example.com',
    },
    event: {
      name: 'Conferência Tech 2024',
    },
    tickets: [{ type: 'VIP', price: 150 }],
    createdAt: '2024-01-01T10:00:00Z',
    formResponses: [
      {
        id: 'fr-1',
        form: { name: 'Dados Adicionais' },
        answers: [
          { id: 'a-1', field: { label: 'Camiseta' }, value: 'P' }
        ]
      }
    ],
    enrollments: [
      {
        id: 'en-1',
        activity: { title: 'Workshop de React', type: { name: 'Prática' } }
      }
    ],
    certificates: [],
    history: []
  };

  const defaultProps = {
    participant: mockParticipant as any,
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar os detalhes básicos do participante quando aberto', () => {
    render(<ParticipantDetailDrawer {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /detalhes do participante/i })).toBeInTheDocument();
    expect(screen.getByText('Ana Participante')).toBeInTheDocument();
    // E-mail aparece no header (subtitle) e no body (total: 2 ocorrências)
    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Conferência Tech 2024')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(<ParticipantDetailDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('não deve renderizar nada quando participant for null', () => {
    const { container } = render(<ParticipantDetailDrawer {...defaultProps} participant={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar as respostas do formulário se disponíveis', () => {
    render(<ParticipantDetailDrawer {...defaultProps} />);

    expect(screen.getByText('Respostas do Formulário')).toBeInTheDocument();
    expect(screen.getByText('Dados Adicionais')).toBeInTheDocument();
    expect(screen.getByText('Camiseta')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('deve mostrar mensagem amigável quando não houver respostas de formulário', () => {
    const participantNoForm = { ...mockParticipant, formResponses: [] };
    render(<ParticipantDetailDrawer {...defaultProps} participant={participantNoForm as any} />);

    expect(screen.getByText('Nenhuma resposta adicional disponível.')).toBeInTheDocument();
  });

  it('deve renderizar as atividades inscritas se disponíveis', () => {
    render(<ParticipantDetailDrawer {...defaultProps} />);

    expect(screen.getByText('Atividades (Grade)')).toBeInTheDocument();
    expect(screen.getByText('Workshop de React')).toBeInTheDocument();
    expect(screen.getByText('Prática')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão de fechar ou no backdrop', () => {
    render(<ParticipantDetailDrawer {...defaultProps} />);
    
    // O modal tem um backdrop (primeira div dentro da raiz) e um botão X
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
