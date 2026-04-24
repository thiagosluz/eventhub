import { render, screen, fireEvent } from '@/test-utils';
import { ConfirmModal } from '../ConfirmModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ConfirmModal Component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Excluir Quadro',
    message: 'Excluir o quadro "Marketing"? Todas as colunas serão removidas.',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar título e mensagem corretamente', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Excluir Quadro')).toBeInTheDocument();
    expect(screen.getByText(/Excluir o quadro "Marketing"/)).toBeInTheDocument();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve chamar onConfirm ao clicar no botão de confirmação', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onCancel ao clicar em Cancelar', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar com variante danger por padrão (botão destrutivo)', () => {
    render(<ConfirmModal {...defaultProps} />);
    const confirmBtn = screen.getByRole('button', { name: /^confirmar$/i });
    expect(confirmBtn.className).toMatch(/bg-destructive/);
  });
});
