import { render, screen, fireEvent } from '@/test-utils';
import { SecureDeleteModal } from '../SecureDeleteModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('SecureDeleteModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Meu Evento Incrível',
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o modal com o título do evento e instruções de segurança', () => {
    render(<SecureDeleteModal {...defaultProps} />);

    expect(screen.getByText('Excluir Evento?')).toBeInTheDocument();
    expect(screen.getByText(/"Meu Evento Incrível"/i)).toBeInTheDocument();
    expect(screen.getByText(/Digite/i)).toBeInTheDocument();
    expect(screen.getByText('EXCLUIR', { selector: 'span' })).toBeInTheDocument();
  });

  it('deve manter o botão de confirmação desabilitado por padrão', () => {
    render(<SecureDeleteModal {...defaultProps} />);
    
    const confirmButton = screen.getByText('Confirmar Exclusão Definitiva').closest('button');
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass('bg-muted');
  });

  it('deve habilitar o botão de confirmação apenas quando a palavra EXCLUIR for digitada', () => {
    render(<SecureDeleteModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Digite a palavra de segurança');
    const confirmButton = screen.getByText('Confirmar Exclusão Definitiva').closest('button');

    // Digita algo errado
    fireEvent.change(input, { target: { value: 'NAO' } });
    expect(confirmButton).toBeDisabled();

    // Digita corretamente
    fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    expect(confirmButton).not.toBeDisabled();
    expect(confirmButton).toHaveClass('bg-destructive');
  });

  it('deve chamar onConfirm quando o botão estiver habilitado e for clicado', () => {
    render(<SecureDeleteModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Digite a palavra de segurança');
    const confirmButton = screen.getByText('Confirmar Exclusão Definitiva').closest('button')!;

    fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar estado de carregamento e desabilitar o botão mesmo com a palavra correta', () => {
    render(<SecureDeleteModal {...defaultProps} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Digite a palavra de segurança');
    fireEvent.change(input, { target: { value: 'EXCLUIR' } });

    // O botão de confirmação é o que contém o spinner quando isLoading é true
    const confirmButton = screen.getAllByRole('button').find(b => b.querySelector('.animate-spin'));
    expect(confirmButton).toBeDisabled();
    expect(confirmButton?.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão Cancelar ou no X', () => {
    render(<SecureDeleteModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
    
    // O XMarkIcon está dentro de um botão. No nosso mock ele é um span.
    // O modal tem o backdrop (div que chama onClose) e os botões.
    // O botão X é o primeiro no DOM dentro do modal.
    const buttons = screen.getAllByRole('button');
    const xButton = buttons.find(b => b.querySelector('[data-testid="icon-XMarkIcon"]'));
    
    if (xButton) {
      fireEvent.click(xButton);
    } else {
      // Fallback se o data-testid não estiver funcionando como esperado
      fireEvent.click(buttons[0]);
    }
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
