import { render, screen, fireEvent } from '@/test-utils';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DeleteConfirmationModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Excluir Item',
    description: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o modal com título e descrição corretamente', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Excluir Item')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja excluir/i)).toBeInTheDocument();
    expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(<DeleteConfirmationModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve chamar onClose ao clicar no botão Cancelar', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('deve chamar onConfirm ao clicar no botão Confirmar Exclusão', () => {
    render(<DeleteConfirmationModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Confirmar Exclusão'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('deve mostrar estado de carregamento e desabilitar o botão de confirmação', () => {
    render(<DeleteConfirmationModal {...defaultProps} isLoading={true} />);
    
    // O botão de confirmação é o que contém o spinner quando isLoading é true
    const confirmButton = screen.getAllByRole('button').find(b => b.querySelector('.animate-spin'));
    
    expect(confirmButton).toBeDisabled();
    expect(confirmButton?.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
