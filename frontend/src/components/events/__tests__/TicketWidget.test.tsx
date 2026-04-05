import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketWidget } from '../TicketWidget';
import { useRouter } from 'next/navigation';

// Mock do useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

const mockEvent = {
  id: 'ev-123',
  slug: 'conferencia-tech-2024',
  name: 'Conferência Tech 2024',
  logoUrl: 'http://example.com/logo.png',
  tenant: { id: 't-1', name: 'Google Developers' }
} as any;

describe('TicketWidget', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it('deve renderizar os dados do ingresso gratuito', () => {
    render(<TicketWidget event={mockEvent} />);
    
    expect(screen.getByText('Ingresso Geral')).toBeInTheDocument();
    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('deve redirecionar para o checkout com os parâmetros corretos ao clicar no botão', () => {
    render(<TicketWidget event={mockEvent} />);
    
    const checkoutBtn = screen.getByRole('button', { name: /Fazer Inscrição/i });
    fireEvent.click(checkoutBtn);

    // Verifica se montou a URL de checkout com query params
    expect(mockPush).toHaveBeenCalledWith('/checkout?eventId=ev-123&slug=conferencia-tech-2024');
  });

  it('deve exibir o nome do tenant e logotipo', () => {
    render(<TicketWidget event={mockEvent} />);
    
    expect(screen.getByText('Google Developers')).toBeInTheDocument();
    expect(screen.getByAltText('Google Developers')).toBeInTheDocument();
    expect(screen.getByAltText('Google Developers')).toHaveAttribute('src', expect.stringContaining('logo.png'));
  });

  it('deve exibir primeira letra do tenant como fallback se não houver logoUrl', () => {
    const eventNoLogo = { ...mockEvent, logoUrl: undefined };
    render(<TicketWidget event={eventNoLogo} />);
    
    // Fallback: G (de Google Developers)
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});
