import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EventAnalyticsPage from '../page';
import { analyticsService } from '@/services/analytics.service';
import React from 'react';

// Mock das dependências
vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getEventAnalytics: vi.fn(),
    getEventParticipants: vi.fn(),
    getEventCheckins: vi.fn(),
  },
}));

// Mock do Recharts com wrapper SVG para evitar erros de tags defs/linearGradient
vi.mock('recharts', () => {
  const MockChart = ({ children, name }: any) => (
    <div data-testid={name}>
      <svg>{children}</svg>
    </div>
  );
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: (props: any) => <MockChart {...props} name="BarChart" />,
    AreaChart: (props: any) => <MockChart {...props} name="AreaChart" />,
    PieChart: (props: any) => <MockChart {...props} name="PieChart" />,
    Bar: () => <g />,
    Area: () => <g />,
    Pie: () => <g />,
    XAxis: () => <g />,
    YAxis: () => <g />,
    CartesianGrid: () => <g />,
    Tooltip: () => <rect />,
    Legend: () => <div />,
    Cell: () => <circle />,
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowLeftIcon: () => <div />,
  UsersIcon: () => <div />,
  TicketIcon: () => <div />,
  CalendarIcon: () => <div />,
  ChevronRightIcon: () => <div />,
  ArrowDownTrayIcon: () => <div />,
  MagnifyingGlassIcon: () => <div />,
  FunnelIcon: () => <div />,
  CheckCircleIcon: () => <div />,
  UserGroupIcon: () => <div />,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ev-123' }),
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockAnalytics = {
  eventId: 'ev-123',
  eventName: 'Conferência Tech',
  totalRegistrations: 100,
  totalCheckins: 60,
  activityParticipation: [{ id: 'a-1', name: 'Palestra IA', enrolled: 50, attended: 30, occupancyRate: 60 }],
  registrationStatus: [{ name: 'COMPLETED', value: 90 }],
  ticketDistribution: [{ name: 'FREE', value: 70 }, { name: 'PAID', value: 30 }],
  dailyRegistrations: [{ date: '2024-01-01', count: 10 }],
};

const mockParticipants = [
  { id: 'p-1', name: 'Maria Silva', email: 'maria@example.com', ticketType: 'PAID', ticketStatus: 'COMPLETED', registrationDate: '2024-01-01', enrollmentsCount: 2 },
];

const mockCheckins = [
  { id: 'c-1', name: 'Maria Silva', email: 'maria@example.com', ticketType: 'PAID', activityName: 'Check-in Geral', checkedAt: '2024-01-01T10:00:00Z' },
];

describe('EventAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsService.getEventAnalytics).mockResolvedValue(mockAnalytics as any);
    vi.mocked(analyticsService.getEventParticipants).mockResolvedValue(mockParticipants as any);
    vi.mocked(analyticsService.getEventCheckins).mockResolvedValue(mockCheckins as any);
    global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
  });

  it('deve renderizar a visão geral (Overview) com métricas', async () => {
    render(<EventAnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Conferência Tech', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    expect(screen.getByText('60')).toBeInTheDocument();
    const percentMetrics = screen.getAllByText('60%');
    expect(percentMetrics.length).toBeGreaterThanOrEqual(2);
  });

  it('deve alternar para a aba de Inscritos e filtrar a tabela', async () => {
    render(<EventAnalyticsPage />);
    
    const tab = await screen.findByRole('button', { name: /Inscritos/i });
    fireEvent.click(tab);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou email/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
  });

  it('deve alternar para a aba de Check-ins e verificar a listagem', async () => {
    render(<EventAnalyticsPage />);
    
    const tab = await screen.findByRole('button', { name: /Check-ins/i });
    fireEvent.click(tab);

    await waitFor(() => {
      // Pega o span da tabela, ignorando o option do select
      const cell = screen.getAllByText('Check-in Geral').find(el => el.tagName === 'SPAN');
      expect(cell).toBeInTheDocument();
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
  });

  it('deve disparar o fluxo de exportação para CSV', async () => {
    render(<EventAnalyticsPage />);
    
    const tab = await screen.findByRole('button', { name: /Inscritos/i });
    fireEvent.click(tab);

    const exportButton = await screen.findByText(/Exportar CSV/i);
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
