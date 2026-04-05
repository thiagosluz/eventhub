import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventCard } from '../EventCard';
import { Event } from '@/types/event';

const mockEvent: Event = {
  id: 'e-1',
  name: 'Conferência de IA 2024',
  slug: 'conferencia-ia-2024',
  description: 'Um evento sobre o futuro da IA',
  startDate: '2024-12-10T09:00:00Z',
  endDate: '2024-12-11T18:00:00Z',
  location: 'Auditório Principal',
  bannerUrl: 'http://example.com/banner.jpg',
  status: 'PUBLISHED',
  tenant: { id: 't-1', name: 'Google Cloud' },
  tickets: [
    { id: 't1', name: 'Premium', price: 150 },
    { id: 't2', name: 'Basic', price: 50 }
  ]
} as any;

describe('EventCard', () => {
  it('deve renderizar os dados básicos do evento', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('Conferência de IA 2024')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();
    expect(screen.getByText('Auditório Principal')).toBeInTheDocument();
  });

  it('deve exibir a data formatada corretamente em pt-BR', () => {
    render(<EventCard event={mockEvent} />);
    
    // 10 de dez. ou 10/12 dependendo da locale configurada no teste
    // No EventCard: day: '2-digit', month: 'short' -> "10 DE DEZ."
    expect(screen.getByText(/10 DE DEZ./i)).toBeInTheDocument();
  });

  it('deve exibir o menor preço de ingresso encontrado', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText(/A partir de R\$ 50/i)).toBeInTheDocument();
  });

  it('deve mostrar "Ver Detalhes" se não houver ingressos listados', () => {
    const eventNoTickets = { ...mockEvent, tickets: [] };
    render(<EventCard event={eventNoTickets} />);
    
    expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
  });

  it('deve mostrar placeholder se não houver bannerUrl', () => {
    const eventNoBanner = { ...mockEvent, bannerUrl: undefined };
    const { container } = render(<EventCard event={eventNoBanner} />);
    
    // Verifica se renderizou o SVG de placeholder (tem a classe w-12 h-12)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('deve conter o link correto para a página do evento', () => {
    render(<EventCard event={mockEvent} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events/conferencia-ia-2024');
  });
});
