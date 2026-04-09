import { KanbanBoard, KanbanColumn, KanbanTask } from "@/types/kanban";

/**
 * Merges multiple boards into a single global view, grouping columns by name
 * and ensuring tasks are de-duplicated across columns with the same name.
 */
export function mergeBoardsToGlobal(boards: KanbanBoard[]): KanbanColumn[] {
  const columnsMap = new Map<string, KanbanColumn>();

  boards.forEach(board => {
    board.columns.forEach(col => {
      if (!columnsMap.has(col.name)) {
        // Create a new column copy with tasks
        columnsMap.set(col.name, { 
          ...col, 
          tasks: [...col.tasks] 
        });
      } else {
        const existing = columnsMap.get(col.name)!;
        const existingTaskIds = new Set(existing.tasks.map(t => t.id));
        
        // Add only unique tasks
        col.tasks.forEach(task => {
          if (!existingTaskIds.has(task.id)) {
            existing.tasks.push(task);
            existingTaskIds.add(task.id);
          }
        });
      }
    });
  });

  return Array.from(columnsMap.values()).sort((a, b) => a.order - b.order);
}

/**
 * Filters tasks based on the provided criteria
 */
export function filterTasks(tasks: KanbanTask[], filters: {
  search: string;
  memberId: string | null;
  priorities: string[];
  onlyOverdue: boolean;
}): KanbanTask[] {
  return tasks.filter(task => {
    const matchesSearch = !filters.search || 
      task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesMember = !filters.memberId || 
      task.assignments?.some(a => a.user.id === filters.memberId);
    
    const matchesPriority = filters.priorities.length === 0 || 
      filters.priorities.includes(task.priority);
    
    const now = new Date();
    const matchesOverdue = !filters.onlyOverdue || 
      (task.deadline && new Date(task.deadline) < now && task.status !== "DONE");

    return matchesSearch && matchesMember && matchesPriority && matchesOverdue;
  });
}
