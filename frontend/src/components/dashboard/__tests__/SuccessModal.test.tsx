import { render, screen, fireEvent } from '@/test-utils';
import { SuccessModal } from '../SuccessModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import confetti from 'canvas-confetti';

// Mock do canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('SuccessModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Sucesso!',
    description: 'A operação foi concluída com êxito.',
    buttonText: 'Continuar',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o modal com título e descrição quando isOpen for true', () => {
    render(<SuccessModal {...defaultProps} />);

    expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    expect(screen.getByText('A operação foi concluída com êxito.')).toBeInTheDocument();
    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(<SuccessModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve chamar onClose ao clicar no botão de fechar (X)', () => {
    render(<SuccessModal {...defaultProps} />);
    
    // O botão com XMarkIcon não tem texto, mas no nosso mock ele é renderizado dentro de um button.
    // O SuccessModal tem dois botões que chamam onClose.
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]); // O primeiro botão é o X
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no botão de ação principal', () => {
    render(<SuccessModal {...defaultProps} />);
    
    const actionButton = screen.getByText('Continuar');
    fireEvent.click(actionButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('deve disparar confetes quando aberto se triggerConfetti for true', () => {
    vi.useFakeTimers();
    render(<SuccessModal {...defaultProps} />);
    
    // Avança o tempo para disparar o primeiro intervalo do confetti (250ms)
    vi.advanceTimersByTime(300);
    
    expect(confetti).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
