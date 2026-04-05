import { render, screen } from '@/test-utils';
import { Sidebar } from '../Sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/context/AuthContext');
vi.mock('next/navigation');

describe('Sidebar Component', () => {
  const mockTenant = {
    id: 't1',
    name: 'EventHub HQ',
    slug: 'hq',
    logoUrl: 'https://logo.com/img.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os itens de navegação para um ORGANIZER', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'ORGANIZER', isSpeaker: false },
    });
    (usePathname as any).mockReturnValue('/dashboard');

    render(<Sidebar tenant={mockTenant} />);

    expect(screen.getByText('EventHub HQ')).toBeInTheDocument();
    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Meus Eventos')).toBeInTheDocument();
    expect(screen.getByText('Criar Novo Evento')).toBeInTheDocument();
  });

  it('deve filtrar itens de navegação para um REVIEWER', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'REVIEWER' },
    });
    (usePathname as any).mockReturnValue('/dashboard');

    render(<Sidebar tenant={mockTenant} />);

    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Revisões')).toBeInTheDocument();
    
    // Itens que NÃO devem aparecer
    expect(screen.queryByText('Meus Eventos')).not.toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
    expect(screen.queryByText('Criar Novo Evento')).not.toBeInTheDocument();
  });

  it('deve destacar o item de navegação ativo', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'ORGANIZER' },
    });
    (usePathname as any).mockReturnValue('/dashboard/events');

    render(<Sidebar tenant={mockTenant} />);

    const eventsLink = screen.getByText('Meus Eventos').closest('a');
    expect(eventsLink).toHaveClass('bg-primary/10');
    expect(eventsLink).toHaveClass('text-primary');
  });

  it('deve mostrar itens de palestrante quando o usuário é SPEAKER ou tem isSpeaker: true', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'SPEAKER', isSpeaker: true },
    });
    (usePathname as any).mockReturnValue('/dashboard');

    render(<Sidebar tenant={mockTenant} />);

    expect(screen.getByText('Minha Agenda')).toBeInTheDocument();
    expect(screen.getByText('Feedbacks')).toBeInTheDocument();
    expect(screen.getByText('Perfil de Palestrante')).toBeInTheDocument();
  });

  it('deve renderizar o logo padrão quando o tenant não fornece logoUrl', () => {
    (useAuth as any).mockReturnValue({
      user: { role: 'ORGANIZER' },
    });
    
    render(<Sidebar tenant={null} />);

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });
});
