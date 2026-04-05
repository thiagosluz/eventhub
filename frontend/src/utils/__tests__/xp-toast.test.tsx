import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { showXpGain } from '../xp-toast';
import React from 'react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Mock das dependências externas
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    custom: vi.fn(),
  },
}));

vi.mock('@heroicons/react/24/solid', () => ({
  SparklesIcon: () => <div data-testid="SparklesIcon" />,
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('showXpGain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve disparar nada se amount <= 0 e não for level up', () => {
    showXpGain(0, false);
    expect(confetti).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it('deve disparar confetes e toast de sucesso no Level Up', () => {
    showXpGain(0, true);
    expect(confetti).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('LEVEL UP'), expect.any(Object));
  });

  it('deve disparar toast customizado quando ganha XP', () => {
    const xpAmount = 50;
    showXpGain(xpAmount, false);
    
    // Captura a função de renderização passada para o toast.custom
    const renderFn = vi.mocked(toast.custom).mock.calls[0][0] as Function;
    
    // Renderiza o componente para cobrir a lógica de animação e o texto
    const { rerender } = render(renderFn({ visible: true }));
    expect(screen.getByText(/\+50 XP Ganho!/i)).toBeInTheDocument();
    
    rerender(renderFn({ visible: false }));
    expect(screen.queryByText(/\+50 XP Ganho!/i)).toBeInTheDocument();
  });

  it('deve disparar ambos (confete e toast) no Level Up com XP positivo', () => {
    showXpGain(100, true);
    expect(confetti).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(toast.custom).toHaveBeenCalled();
  });
});
