import { describe, it, expect } from 'vitest';
import { mergeBoardsToGlobal, filterTasks } from '../kanban-logic';
import { KanbanBoard, KanbanTask } from '@/types/kanban';

describe('KanbanLogic Utils', () => {
  describe('mergeBoardsToGlobal', () => {
    it('should merge columns with the same name and de-duplicate tasks', () => {
      const boards: KanbanBoard[] = [
        {
          id: 'b1',
          name: 'Board 1',
          eventId: 'e1',
          columns: [
            {
              id: 'c1',
              name: 'To Do',
              order: 0,
              color: 'slate',
              tasks: [
                { id: 't1', title: 'Task 1', priority: 'LOW', status: 'TODO', columnId: 'c1' } as KanbanTask,
              ]
            }
          ]
        },
        {
          id: 'b2',
          name: 'Board 2',
          eventId: 'e1',
          columns: [
            {
              id: 'c2',
              name: 'To Do',
              order: 0,
              color: 'slate',
              tasks: [
                { id: 't1', title: 'Task 1', priority: 'LOW', status: 'TODO', columnId: 'c2' } as KanbanTask,
                { id: 't2', title: 'Task 2', priority: 'HIGH', status: 'TODO', columnId: 'c2' } as KanbanTask,
              ]
            }
          ]
        }
      ];

      const merged = mergeBoardsToGlobal(boards);

      expect(merged).toHaveLength(1);
      expect(merged[0].name).toBe('To Do');
      expect(merged[0].tasks).toHaveLength(2);
      expect(merged[0].tasks.map(t => t.id)).toEqual(['t1', 't2']);
    });

    it('should preserve column order from the first appearance', () => {
      const boards: KanbanBoard[] = [
        {
          id: 'b1',
          name: 'B1',
          eventId: 'e1',
          columns: [
            { id: 'c1', name: 'Col A', order: 1, color: 'slate', tasks: [] },
            { id: 'c2', name: 'Col B', order: 0, color: 'slate', tasks: [] },
          ]
        }
      ];

      const merged = mergeBoardsToGlobal(boards);
      expect(merged[0].name).toBe('Col B');
      expect(merged[1].name).toBe('Col A');
    });
  });

  describe('filterTasks', () => {
    const tasks: KanbanTask[] = [
      { id: 't1', title: 'Bug critical', description: 'Fix it', priority: 'URGENT', status: 'TODO' } as KanbanTask,
      { id: 't2', title: 'Feat alpha', description: 'Build it', priority: 'LOW', status: 'TODO' } as KanbanTask,
    ];

    it('should filter by search text', () => {
      const filters = { search: 'Bug', memberId: null, priorities: [], onlyOverdue: false };
      const filtered = filterTasks(tasks, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('t1');
    });

    it('should filter by priority', () => {
      const filters = { search: '', memberId: null, priorities: ['URGENT'], onlyOverdue: false };
      const filtered = filterTasks(tasks, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('URGENT');
    });

    it('should return all tasks when filters are empty', () => {
      const filters = { search: '', memberId: null, priorities: [], onlyOverdue: false };
      const filtered = filterTasks(tasks, filters);
      expect(filtered).toHaveLength(2);
    });
  });
});
