import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigTab } from '../ConfigTab';
import { submissionsService } from '@/services/submissions.service';
import toast from 'react-hot-toast';

// Mock das dependências
vi.mock('@heroicons/react/24/outline', () => ({
  Cog6ToothIcon: () => <div data-testid="Cog6ToothIcon" />,
  CheckCircleIcon: () => <div data-testid="CheckCircleIcon" />,
  AcademicCapIcon: () => <div data-testid="AcademicCapIcon" />,
  UserIcon: () => <div data-testid="UserIcon" />,
  EnvelopeIcon: () => <div data-testid="EnvelopeIcon" />,
  CalendarIcon: () => <div data-testid="CalendarIcon" />,
  TagIcon: () => <div data-testid="TagIcon" />,
  TrashIcon: () => <div data-testid="TrashIcon" />,
  ArrowUpTrayIcon: () => <div data-testid="ArrowUpTrayIcon" />,
  PlusIcon: () => <div data-testid="PlusIcon" />,
  BookOpenIcon: () => <div data-testid="BookOpenIcon" />,
  DocumentTextIcon: () => <div data-testid="DocumentTextIcon" />,
}));

vi.mock('@/services/submissions.service', () => ({
  submissionsService: {
    updateSubmissionConfig: vi.fn(),
    createModality: vi.fn(),
    deleteModality: vi.fn(),
    createThematicArea: vi.fn(),
    deleteThematicArea: vi.fn(),
    createRule: vi.fn(),
    deleteRule: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockConfig = {
  id: 'conf-1',
  submissionsEnabled: true,
  submissionStartDate: '2024-01-01T10:00',
  submissionEndDate: '2024-12-31T23:59',
  scientificCommitteeHead: 'Dr. Silva',
  scientificCommitteeEmail: 'comissao@exemplo.com',
  submissionModalities: [{ id: 'mod-1', name: 'Artigo' }],
  thematicAreas: [{ id: 'area-1', name: 'IA' }],
  submissionRules: [{ id: 'rule-1', title: 'Regras', fileUrl: '#' }],
};

describe('ConfigTab', () => {
  const eventId = 'ev-123';
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar os dados iniciais da configuração', () => {
    render(<ConfigTab eventId={eventId} config={mockConfig as any} onRefresh={onRefresh} />);
    expect(screen.getByDisplayValue('Dr. Silva')).toBeInTheDocument();
    expect(screen.getByText('Artigo')).toBeInTheDocument();
  });

  it('deve salvar a configuração geral ao clicar no botão', async () => {
    vi.mocked(submissionsService.updateSubmissionConfig).mockResolvedValue({} as any);
    render(<ConfigTab eventId={eventId} config={mockConfig as any} onRefresh={onRefresh} />);

    fireEvent.change(screen.getByPlaceholderText('Nome do responsável'), { target: { value: 'Dr. Santos' } });
    fireEvent.click(screen.getByText(/Salvar Configuração/i));

    await waitFor(() => {
      expect(submissionsService.updateSubmissionConfig).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Configuração salva com sucesso!');
    });
  });

  it('deve adicionar uma nova modalidade', async () => {
    vi.mocked(submissionsService.createModality).mockResolvedValue({} as any);
    render(<ConfigTab eventId={eventId} config={mockConfig as any} onRefresh={onRefresh} />);

    fireEvent.change(screen.getByPlaceholderText('Nome da modalidade'), { target: { value: 'Banner' } });
    const addButtons = screen.getAllByRole('button', { name: /Adicionar/i });
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(submissionsService.createModality).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Modalidade criada!');
    });
  });

  it('deve remover uma área temática', async () => {
    vi.mocked(submissionsService.deleteThematicArea).mockResolvedValue({} as any);
    render(<ConfigTab eventId={eventId} config={mockConfig as any} onRefresh={onRefresh} />);

    const areaElement = screen.getByText('IA').closest('div');
    const deleteBtn = areaElement?.querySelector('button');
    if (deleteBtn) fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(submissionsService.deleteThematicArea).toHaveBeenCalledWith(eventId, 'area-1');
      expect(toast.success).toHaveBeenCalledWith('Área temática removida!');
    });
  });
});
