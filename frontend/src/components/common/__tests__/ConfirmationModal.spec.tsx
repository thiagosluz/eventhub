import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../ConfirmationModal';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Title',
    description: 'Test Description',
  };

  it('renders correctly when open', () => {
    render(<ConfirmationModal {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ConfirmationModal {...defaultProps} isLoading={true} />);
    const confirmButton = screen.queryByText('Confirmar');
    expect(confirmButton).not.toBeInTheDocument();
    // The spinner div should be there
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
