import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { ParticipantsModal } from '../ParticipantsModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { activitiesService } from '@/services/activities.service';

// Mock do serviço de atividades
vi.mock('@/services/activities.service', () => ({
  activitiesService: {
    listEnrollments: vi.fn(),
    confirmEnrollment: vi.fn(),
  },
}));

describe('ParticipantsModal Component', () => {
  const mockActivity = {
    id: 'act-1',
    title: 'Workshop de React',
    description: 'Aprenda React do zero',
    startAt: '2024-05-01T10:00:00Z',
    endAt: '2024-05-01T12:00:00Z',
  };

  const mockEnrollments = [
    {
      id: 'en-1',
      status: 'CONFIRMED',
      createdAt: '2024-04-01T10:00:00Z',
      registration: {
        user: { name: 'Alice Smith', email: 'alice@example.com' }
      }
    },
    {
      id: 'en-2',
      status: 'PENDING',
      createdAt: '2024-04-02T11:00:00Z',
      registration: {
        user: { name: 'Bob Johnson', email: 'bob@example.com' }
      }
    }
  ];

  const defaultProps = {
    activity: mockActivity as any,
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (activitiesService.listEnrollments as any).mockResolvedValue(mockEnrollments);
  });

  it('não deve renderizar se isOpen for false', () => {
    render(<ParticipantsModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Workshop de React')).not.toBeInTheDocument();
  });

  it('deve renderizar a lista de inscritos corretamente', async () => {
    render(<ParticipantsModal {...defaultProps} />);

    expect(screen.getByText('Workshop de React')).toBeInTheDocument();
    expect(screen.getByText('Buscando inscritos...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('deve chamar onClose ao clicar no botão de fechar', () => {
    render(<ParticipantsModal {...defaultProps} />);
    const closeButton = screen.getByTestId('icon-XMarkIcon').closest('button')!;
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('deve confirmar uma inscrição pendente ao clicar no botão de confirmação', async () => {
    (activitiesService.confirmEnrollment as any).mockResolvedValue({});
    render(<ParticipantsModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText('Bob Johnson')).toBeInTheDocument());

    const confirmButton = screen.getByTestId('icon-CheckIcon').closest('button')!;
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(activitiesService.confirmEnrollment).toHaveBeenCalledWith('act-1', 'en-2');
      // Verifica se recarregou a lista
      expect(activitiesService.listEnrollments).toHaveBeenCalledTimes(2);
    });
  });

  it('deve mostrar mensagem de lista vazia quando não houver inscritos', async () => {
    (activitiesService.listEnrollments as any).mockResolvedValue([]);
    render(<ParticipantsModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum inscrito ainda')).toBeInTheDocument();
    });
  });
});
