import { render, screen, fireEvent } from '@/test-utils';
import { BoardSelector } from '../BoardSelector';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { KanbanBoard } from '@/types/kanban';

vi.mock('@/services/kanban.service', () => ({
  kanbanService: {
    createBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('BoardSelector Component', () => {
  const boards: KanbanBoard[] = [
    { id: 'b1', name: 'Marketing', eventId: 'e1', columns: [], _count: { columns: 3 } },
    { id: 'b2', name: 'Financeiro', eventId: 'e1', columns: [], _count: { columns: 2 } },
  ];

  const defaultProps = {
    boards,
    activeBoardId: 'b1',
    eventId: 'e1',
    onBoardSelect: vi.fn(),
    onBoardsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os boards como tabs', () => {
    render(<BoardSelector {...defaultProps} />);
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
  });

  it('deve chamar onBoardSelect ao clicar em um board', () => {
    render(<BoardSelector {...defaultProps} />);
    fireEvent.click(screen.getByText('Financeiro'));
    expect(defaultProps.onBoardSelect).toHaveBeenCalledWith('b2');
  });

  it('deve mostrar input ao clicar em "Novo Quadro"', () => {
    render(<BoardSelector {...defaultProps} />);
    fireEvent.click(screen.getByText(/Novo Quadro/));
    expect(screen.getByPlaceholderText('Nome do quadro...')).toBeInTheDocument();
  });

  it('não deve renderizar botão excluir quando há apenas 1 board', () => {
    const singleBoard: KanbanBoard[] = [
      { id: 'b1', name: 'Único', eventId: 'e1', columns: [], _count: { columns: 1 } },
    ];
    const { container } = render(<BoardSelector {...defaultProps} boards={singleBoard} />);
    const trashButtons = container.querySelectorAll('[title="Excluir"]');
    expect(trashButtons.length).toBe(0);
  });

  it('modal de confirmação não deve estar visível inicialmente', () => {
    render(<BoardSelector {...defaultProps} />);
    expect(screen.queryByText(/Esta ação não pode ser desfeita/)).not.toBeInTheDocument();
  });
});
