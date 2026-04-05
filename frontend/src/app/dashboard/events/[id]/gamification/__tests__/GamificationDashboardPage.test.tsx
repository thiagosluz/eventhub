import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GamificationDashboardPage from '../page';
import { badgesService } from '@/services/badges.service';
import { analyticsService } from '@/services/analytics.service';
import { eventsService } from '@/services/events.service';
import React from 'react';

// Mock de ícones completo
vi.mock('@heroicons/react/24/outline', () => ({
  TrophyIcon: () => <div />, PlusIcon: () => <div />, TrashIcon: () => <div />,
  ChevronLeftIcon: () => <div />, SparklesIcon: () => <div />, FireIcon: () => <div />,
  CheckBadgeIcon: () => <div />, QrCodeIcon: () => <div />, UserGroupIcon: () => <div />,
  ArrowPathIcon: () => <div />, ArrowDownTrayIcon: () => <div />, MagnifyingGlassIcon: () => <div />,
  CalendarIcon: () => <div />, FunnelIcon: () => <div />, ExclamationTriangleIcon: () => <div />,
  ChartBarIcon: () => <div />, ListBulletIcon: () => <div />,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  TrophyIcon: () => <div />, SparklesIcon: () => <div />,
}));

vi.mock('@/services/badges.service', () => ({
  badgesService: { getEventBadges: vi.fn(), createBadge: vi.fn(), deleteBadge: vi.fn(), getClaimCodes: vi.fn(), awardByScan: vi.fn() },
}));

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getGamificationStats: vi.fn(), getGamificationRanking: vi.fn(), getGamificationAlerts: vi.fn(),
    getAwardedBadgesHistory: vi.fn(), resolveAlert: vi.fn(), revokeBadge: vi.fn()
  },
}));

vi.mock('@/services/events.service', () => ({
  eventsService: { getOrganizerEventById: vi.fn() },
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({ start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined), isScanning: false })),
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'ev-1' }) }));
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockEvent = { id: 'ev-1', name: 'Gamification Test Event', slug: 'gamification-test' };
const mockStats = { totalXpDistributed: 5000, totalBadgesAwarded: 150, activeAlertsCount: 2, totalParticipants: 100 };
const mockRanking = [{ userId: 'u-1', userName: 'Thiago Auditor', eventXp: 1200, globalLevel: 15, avatarUrl: '' }];
const mockHistory = [
  { id: 'h-1', userId: 'u-1', badgeId: 'b-rare', earnedAt: '2024-05-15T10:00:00Z', user: { name: 'Thiago Auditor', email: 'thiago@example.com' }, badge: { name: 'Pioneiro', iconUrl: '🚀', color: 'blue' } },
  { id: 'h-2', userId: 'u-2', badgeId: 'b-common', earnedAt: '2024-05-16T15:30:00Z', user: { name: 'Maria Silva', email: 'maria@example.com' }, badge: { name: 'Participante', iconUrl: '🏅', color: 'emerald' } }
];

describe('GamificationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(eventsService.getOrganizerEventById).mockResolvedValue(mockEvent as any);
    vi.mocked(badgesService.getEventBadges).mockResolvedValue([] as any);
    vi.mocked(analyticsService.getGamificationStats).mockResolvedValue(mockStats as any);
    vi.mocked(analyticsService.getGamificationRanking).mockResolvedValue(mockRanking as any);
    vi.mocked(analyticsService.getAwardedBadgesHistory).mockResolvedValue(mockHistory as any);
    global.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
  });

  const getParams = () => {
    const p = Promise.resolve({ id: 'ev-1' });
    (p as any)._value = { id: 'ev-1' };
    return p;
  };

  it('deve carregar estatísticas iniciais', async () => {
    render(<GamificationDashboardPage params={getParams() as any} />);
    expect(await screen.findByText('5000')).toBeInTheDocument();
  });

  it('deve filtrar por nome na auditoria', async () => {
    render(<GamificationDashboardPage params={getParams() as any} />);
    const auditTab = await screen.findByRole('button', { name: /Auditoria/i });
    fireEvent.click(auditTab);

    expect(await screen.findByText('Thiago Auditor')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Nome ou email.../i), { target: { value: 'Thiago' } });
    expect(screen.getByText('Thiago Auditor')).toBeInTheDocument();
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
  });

  it('deve filtrar por data fixa na auditoria', async () => {
    render(<GamificationDashboardPage params={getParams() as any} />);
    fireEvent.click(await screen.findByRole('button', { name: /Auditoria/i }));
    await screen.findByText('Thiago Auditor');

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2024-05-16' } });
    
    expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
    expect(screen.queryByText('Thiago Auditor')).not.toBeInTheDocument();
  });

  it('deve disparar ação de revogar badge', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    render(<GamificationDashboardPage params={getParams() as any} />);
    fireEvent.click(await screen.findByRole('button', { name: /Auditoria/i }));
    const revokeBtn = await screen.findAllByTitle(/Revogar Conquista/i);
    fireEvent.click(revokeBtn[0]);
    expect(analyticsService.revokeBadge).toHaveBeenCalledWith('h-1');
  });
});
