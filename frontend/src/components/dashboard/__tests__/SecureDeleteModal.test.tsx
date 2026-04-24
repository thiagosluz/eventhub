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

    expect(screen.getByRole('heading', { name: /excluir evento\?/i })).toBeInTheDocument();
    expect(screen.getByText(/"Meu Evento Incrível"/i)).toBeInTheDocument();
    expect(screen.getByText(/Digite/i)).toBeInTheDocument();
    expect(screen.getByText('EXCLUIR', { selector: 'span' })).toBeInTheDocument();
  });

  it('deve manter o botão de confirmação desabilitado por padrão', () => {
    render(<SecureDeleteModal {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    expect(confirmButton).toBeDisabled();
  });

  it('deve habilitar o botão de confirmação apenas quando a palavra EXCLUIR for digitada', () => {
    render(<SecureDeleteModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('EXCLUIR');
    const confirmButton = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });

    fireEvent.change(input, { target: { value: 'NAO' } });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    expect(confirmButton).not.toBeDisabled();
  });

  it('deve chamar onConfirm quando o botão estiver habilitado e for clicado', () => {
    render(<SecureDeleteModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('EXCLUIR');
    const confirmButton = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });

    fireEvent.change(input, { target: { value: 'EXCLUIR' } });
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar estado de carregamento e desabilitar o botão mesmo com a palavra correta', () => {
    render(<SecureDeleteModal {...defaultProps} isLoading={true} />);

    const input = screen.getByPlaceholderText('EXCLUIR');
    fireEvent.change(input, { target: { value: 'EXCLUIR' } });

    const confirmButton = screen.getByRole('button', { name: /confirmar exclusão definitiva/i });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveAttribute('aria-busy', 'true');
  });

  it('deve chamar onClose ao clicar no botão Cancelar ou no X', () => {
    render(<SecureDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();

    const xButton = screen.getByRole('button', { name: /fechar/i });
    fireEvent.click(xButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
