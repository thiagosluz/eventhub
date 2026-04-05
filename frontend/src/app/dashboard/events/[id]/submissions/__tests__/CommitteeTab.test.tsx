import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommitteeTab } from '../CommitteeTab';
import { submissionsService } from '@/services/submissions.service';
import { usersService } from '@/services/users.service';
import toast from 'react-hot-toast';

// Mock das dependências
vi.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <div data-testid="UsersIcon" />,
  PlusIcon: () => <div data-testid="PlusIcon" />,
  TrashIcon: () => <div data-testid="TrashIcon" />,
  UserPlusIcon: () => <div data-testid="UserPlusIcon" />,
  MagnifyingGlassIcon: () => <div data-testid="MagnifyingGlassIcon" />,
  EnvelopeIcon: () => <div data-testid="EnvelopeIcon" />,
  ClipboardDocumentCheckIcon: () => <div data-testid="ClipboardDocumentCheckIcon" />,
  ClockIcon: () => <div data-testid="ClockIcon" />,
  CheckCircleIcon: () => <div data-testid="CheckCircleIcon" />,
  XCircleIcon: () => <div data-testid="XCircleIcon" />,
  ChevronRightIcon: () => <div data-testid="ChevronRightIcon" />,
  DocumentIcon: () => <div data-testid="DocumentIcon" />,
}));

vi.mock('@/services/submissions.service', () => ({
  submissionsService: {
    listEventReviewers: vi.fn(),
    addReviewerToEvent: vi.fn(),
    removeReviewerFromEvent: vi.fn(),
    inviteReviewer: vi.fn(),
    manualRegisterReviewer: vi.fn(),
  },
}));

vi.mock('@/services/users.service', () => ({
  usersService: {
    getUsers: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de Image do Next.js
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockCommittee = [
  { id: 'u-1', name: 'Maria Revisora', email: 'maria@example.com', role: 'REVIEWER' },
];

const mockTenantUsers = [
  { id: 'u-1', name: 'Maria Revisora', email: 'maria@example.com', role: 'REVIEWER' },
  { id: 'u-2', name: 'João Disponível', email: 'joao@example.com', role: 'REVIEWER' },
  { id: 'u-3', name: 'Ana Admin', email: 'ana@example.com', role: 'ORGANIZER' },
];

describe('CommitteeTab', () => {
  const eventId = 'ev-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(submissionsService.listEventReviewers).mockResolvedValue(mockCommittee as any);
    vi.mocked(usersService.getUsers).mockResolvedValue(mockTenantUsers as any);
  });

  it('deve carregar e listar os revisores atuais e disponíveis', async () => {
    render(<CommitteeTab eventId={eventId} />);

    // Verifica loading
    expect(screen.getByText(/Carregando comitê.../i)).toBeInTheDocument();

    await waitFor(() => {
      // Revisor atual
      expect(screen.getByText('Maria Revisora')).toBeInTheDocument();
      // Revisor disponível (João)
      expect(screen.getByText('João Disponível')).toBeInTheDocument();
      // Admin não deve aparecer na lista de "Adicionar" pois não é ROLE_REVIEWER ou já está no comitê
      expect(screen.queryByText('Ana Admin')).not.toBeInTheDocument();
    });
  });

  it('deve permitir buscar/filtrar revisores disponíveis', async () => {
    render(<CommitteeTab eventId={eventId} />);
    await waitFor(() => screen.getByText('João Disponível'));

    const searchInput = screen.getByPlaceholderText(/Buscar revisores cadastrados/i);
    fireEvent.change(searchInput, { target: { value: 'João' } });

    expect(screen.getByText('João Disponível')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });
    expect(screen.queryByText('João Disponível')).not.toBeInTheDocument();
    expect(screen.getByText(/Nenhum revisor disponível com esse nome/i)).toBeInTheDocument();
  });

  it('deve adicionar um revisor ao comitê', async () => {
    vi.mocked(submissionsService.addReviewerToEvent).mockResolvedValue({} as any);
    
    render(<CommitteeTab eventId={eventId} />);
    await waitFor(() => screen.getByText('João Disponível'));

    const addButtons = screen.getAllByTitle('Adicionar ao Comitê');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(submissionsService.addReviewerToEvent).toHaveBeenCalledWith(eventId, 'u-2');
      expect(toast.success).toHaveBeenCalledWith('Revisor adicionado ao comitê!');
    });
  });

  it('deve remover um revisor do comitê', async () => {
    vi.mocked(submissionsService.removeReviewerFromEvent).mockResolvedValue({} as any);
    
    render(<CommitteeTab eventId={eventId} />);
    await waitFor(() => screen.getByText('Maria Revisora'));

    const removeButtons = screen.getAllByTitle('Remover do Comitê');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(submissionsService.removeReviewerFromEvent).toHaveBeenCalledWith(eventId, 'u-1');
      expect(toast.success).toHaveBeenCalledWith('Revisor removido do comitê!');
    });
  });

  it('deve mostrar formulários de convite e cadastro manual ao clicar nos botões', async () => {
    render(<CommitteeTab eventId={eventId} />);
    await waitFor(() => screen.getByText('Convidar Revisor'));

    // Testa formulário de convite
    fireEvent.click(screen.getByText('Convidar Revisor'));
    expect(screen.getByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
    expect(screen.getByText('Enviar Convite')).toBeInTheDocument();

    // Testa formulário manual
    fireEvent.click(screen.getByText('Cadastrar Manualmente'));
    expect(screen.getByPlaceholderText('Nome do revisor')).toBeInTheDocument();
    expect(screen.getByText('Finalizar Cadastro')).toBeInTheDocument();
  });
});
