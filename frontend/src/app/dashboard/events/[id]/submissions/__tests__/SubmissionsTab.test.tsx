import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionsTab } from '../SubmissionsTab';
import { submissionsService } from '@/services/submissions.service';
import toast from 'react-hot-toast';

// Mock das dependências
vi.mock('@heroicons/react/24/outline', () => ({
  DocumentTextIcon: () => <div data-testid="DocumentTextIcon" />,
  FunnelIcon: () => <div data-testid="FunnelIcon" />,
  UserGroupIcon: () => <div data-testid="UserGroupIcon" />,
  TrashIcon: () => <div data-testid="TrashIcon" />,
  PlusIcon: () => <div data-testid="PlusIcon" />,
  CheckCircleIcon: () => <div data-testid="CheckCircleIcon" />,
  ClockIcon: () => <div data-testid="ClockIcon" />,
  AcademicCapIcon: () => <div data-testid="AcademicCapIcon" />,
  TagIcon: () => <div data-testid="TagIcon" />,
  BookOpenIcon: () => <div data-testid="BookOpenIcon" />,
  MagnifyingGlassIcon: () => <div data-testid="MagnifyingGlassIcon" />,
}));

vi.mock('@/services/submissions.service', () => ({
  submissionsService: {
    listSubmissionsForEvent: vi.fn(),
    listEventReviewers: vi.fn(),
    assignReview: vi.fn(),
    deleteReview: vi.fn(),
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
  submissionStartDate: '2024-01-01',
  submissionEndDate: '2024-12-31',
  submissionModalities: [
    { id: 'mod-1', name: 'Artigo Completo' },
    { id: 'mod-2', name: 'Resumo Expandido' },
  ],
  thematicAreas: [
    { id: 'area-1', name: 'Inteligência Artificial' },
    { id: 'area-2', name: 'Sistemas Distribuídos' },
  ],
  submissionRules: [],
};

const mockSubmissions = [
  {
    id: 'sub-1',
    title: 'IA no Campo',
    authorId: 'u-author',
    author: { name: 'João Autor' },
    modalityId: 'mod-1',
    modality: { id: 'mod-1', name: 'Artigo Completo' },
    thematicAreaId: 'area-1',
    thematicArea: { id: 'area-1', name: 'Inteligência Artificial' },
    status: 'SUBMITTED',
    createdAt: '2024-05-01T10:00:00Z',
    reviews: [
      { id: 'rev-1', reviewerId: 'u-rev-1', reviewer: { id: 'u-rev-1', name: 'Maria Revisora' }, score: null }
    ]
  },
  {
    id: 'sub-2',
    title: 'Blockchain e IoT',
    author: { name: 'Ana Pesquisadora' },
    modalityId: 'mod-2',
    modality: { id: 'mod-2', name: 'Resumo Expandido' },
    thematicAreaId: 'area-2',
    thematicArea: { id: 'area-2', name: 'Sistemas Distribuídos' },
    status: 'ACCEPTED',
    createdAt: '2024-05-02T10:00:00Z',
    reviews: []
  }
];

const mockCommittee = [
  { id: 'u-rev-1', name: 'Maria Revisora' },
  { id: 'u-rev-2', name: 'José Revisor' },
];

describe('SubmissionsTab', () => {
  const eventId = 'ev-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(submissionsService.listSubmissionsForEvent).mockResolvedValue(mockSubmissions as any);
    vi.mocked(submissionsService.listEventReviewers).mockResolvedValue(mockCommittee as any);
  });

  it('deve carregar e listar as submissões do evento', async () => {
    render(<SubmissionsTab eventId={eventId} config={mockConfig as any} />);
    await waitFor(() => {
      expect(screen.getByText('IA no Campo')).toBeInTheDocument();
      expect(screen.getByText('Blockchain e IoT')).toBeInTheDocument();
    });
  });

  it('deve filtrar as submissões por título ou autor', async () => {
    render(<SubmissionsTab eventId={eventId} config={mockConfig as any} />);
    await waitFor(() => screen.getByText('IA no Campo'));

    const searchInput = screen.getByPlaceholderText(/Título ou Autor.../i);
    fireEvent.change(searchInput, { target: { value: 'Blockchain' } });
    expect(screen.getByText('Blockchain e IoT')).toBeInTheDocument();
    expect(screen.queryByText('IA no Campo')).not.toBeInTheDocument();
  });

  it('deve atribuir um revisor a uma submissão', async () => {
    vi.mocked(submissionsService.assignReview).mockResolvedValue({} as any);
    render(<SubmissionsTab eventId={eventId} config={mockConfig as any} />);
    await waitFor(() => screen.getByText('IA no Campo'));

    const assignSelects = screen.getAllByRole('combobox').filter(s => s.classList.contains('cursor-pointer'));
    fireEvent.change(assignSelects[1], { target: { value: 'u-rev-2' } });

    await waitFor(() => {
      expect(submissionsService.assignReview).toHaveBeenCalledWith('sub-2', 'u-rev-2');
      expect(toast.success).toHaveBeenCalledWith('Revisor atribuído!');
    });
  });

  it('deve remover uma distribuição de revisão', async () => {
    vi.mocked(submissionsService.deleteReview).mockResolvedValue({} as any);
    render(<SubmissionsTab eventId={eventId} config={mockConfig as any} />);
    await waitFor(() => screen.getByText(/Maria Revisora/i, { selector: 'span' }));

    const removeButton = screen.getByTitle(/Remover Revisor/i);
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(submissionsService.deleteReview).toHaveBeenCalledWith('rev-1');
      expect(toast.success).toHaveBeenCalledWith('Distribuição removida!');
    });
  });
});
