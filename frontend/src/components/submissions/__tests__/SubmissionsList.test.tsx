import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionsList } from '../SubmissionsList';
import { submissionsService } from '@/services/submissions.service';
import { Submission } from '@/types/event';

// Mock do service
vi.mock('@heroicons/react/24/outline', () => ({
  ClipboardDocumentCheckIcon: () => <div data-testid="ClipboardDocumentCheckIcon" />,
  ClockIcon: () => <div data-testid="ClockIcon" />,
  CheckCircleIcon: () => <div data-testid="CheckCircleIcon" />,
  XCircleIcon: () => <div data-testid="XCircleIcon" />,
  ChevronRightIcon: () => <div data-testid="ChevronRightIcon" />,
  DocumentIcon: () => <div data-testid="DocumentIcon" />,
}));

vi.mock('@/services/submissions.service', () => ({
  submissionsService: {
    listMySubmissions: vi.fn(),
  },
}));

const mockSubmissions: Submission[] = [
  {
    id: 's-1',
    title: 'Impacto da IA na Medicina',
    abstract: 'Um resumo detalhado sobre IA...',
    status: 'ACCEPTED',
    createdAt: '2024-01-01T10:00:00Z',
    fileUrl: 'http://example.com/file1.pdf',
    event: { id: 'e-1', name: 'MedTech 2024', slug: 'medtech-2024' }
  },
  {
    id: 's-2',
    title: 'Novas Fronteiras do Espaço',
    status: 'UNDER_REVIEW',
    createdAt: '2024-02-01T10:00:00Z',
    fileUrl: 'http://example.com/file2.pdf',
    event: { id: 'e-2', name: 'SpaceConf', slug: 'spaceconf' }
  }
] as any;

describe('SubmissionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar placeholders durante o carregamento', () => {
    vi.mocked(submissionsService.listMySubmissions).mockReturnValue(new Promise(() => {}));
    const { container } = render(<SubmissionsList />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('deve renderizar estado vazio quando não há submissões', async () => {
    vi.mocked(submissionsService.listMySubmissions).mockResolvedValue([]);
    render(<SubmissionsList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Nenhuma submissão encontrada/i)).toBeInTheDocument();
      expect(screen.getByText(/Explorar Eventos/i)).toBeInTheDocument();
    });
  });

  it('deve listar as submissões corretamente com seus respectivos status', async () => {
    vi.mocked(submissionsService.listMySubmissions).mockResolvedValue(mockSubmissions);
    render(<SubmissionsList />);

    await waitFor(() => {
      expect(screen.getByText('Impacto da IA na Medicina')).toBeInTheDocument();
      expect(screen.getByText('Aceito')).toBeInTheDocument();
      expect(screen.getByText('Novas Fronteiras do Espaço')).toBeInTheDocument();
      expect(screen.getByText('Em Revisão')).toBeInTheDocument();
    });

    expect(screen.getByText('MedTech 2024')).toBeInTheDocument();
    expect(screen.getByText('SpaceConf')).toBeInTheDocument();
  });

  it('deve conter o link correto para o arquivo submetido', async () => {
    vi.mocked(submissionsService.listMySubmissions).mockResolvedValue(mockSubmissions);
    render(<SubmissionsList />);

    await waitFor(() => {
      const links = screen.getAllByText('Ver Arquivo');
      expect(links[0].closest('a')).toHaveAttribute('href', 'http://example.com/file1.pdf');
    });
  });

  it('deve exibir a data formatada corretamente', async () => {
    vi.mocked(submissionsService.listMySubmissions).mockResolvedValue(mockSubmissions);
    render(<SubmissionsList />);

    await waitFor(() => {
      // 01 de janeiro ou 01/01 dependendo da locale
      expect(screen.getByText(/Enviado em: 01 de janeiro de 2024/i)).toBeInTheDocument();
    });
  });
});
