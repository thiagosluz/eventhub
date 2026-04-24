import { render, screen, fireEvent } from '@/test-utils';
import { ColumnManagerModal } from '../ColumnManagerModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { KanbanColumn, KanbanTask } from '@/types/kanban';

function makeTask(id: string, columnId: string): KanbanTask {
  return {
    id,
    title: `Task ${id}`,
    priority: 'LOW',
    status: 'TODO',
    columnId,
  };
}

vi.mock('@/services/kanban.service', () => ({
  kanbanService: {
    createColumn: vi.fn(),
    updateColumn: vi.fn(),
    deleteColumn: vi.fn(),
    reorderColumns: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ColumnManagerModal Component', () => {
  const columns: KanbanColumn[] = [
    {
      id: 'c1',
      name: 'Backlog',
      order: 0,
      color: 'slate',
      tasks: [makeTask('t1', 'c1'), makeTask('t2', 'c1')],
    },
    { id: 'c2', name: 'Em Andamento', order: 1, color: 'blue', tasks: [] },
    {
      id: 'c3',
      name: 'Concluído',
      order: 2,
      color: 'emerald',
      tasks: [makeTask('t3', 'c3')],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    boardId: 'b1',
    columns,
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todas as colunas com seus nomes', () => {
    render(<ColumnManagerModal {...defaultProps} />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(<ColumnManagerModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve ter input para nova coluna', () => {
    render(<ColumnManagerModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Nova coluna...')).toBeInTheDocument();
  });

  it('deve ter título Gerenciar Colunas', () => {
    render(<ColumnManagerModal {...defaultProps} />);
    expect(screen.getByText('Gerenciar Colunas')).toBeInTheDocument();
  });

  it('deve ter subtítulo de instrução', () => {
    render(<ColumnManagerModal {...defaultProps} />);
    expect(screen.getByText('Arraste para reordenar')).toBeInTheDocument();
  });
});
