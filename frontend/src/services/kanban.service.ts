import { api } from "@/lib/api";
import { KanbanBoard, KanbanColumn, KanbanTask, WorkloadMember } from "@/types/kanban";

export const kanbanService = {
  // Board
  getBoards: (eventId: string): Promise<KanbanBoard[]> => api.get(`/kanban/event/${eventId}/boards`),
  
  getBoardDetails: (boardId: string): Promise<KanbanBoard> => api.get(`/kanban/board/${boardId}`),
  
  createBoard: (eventId: string, name: string): Promise<KanbanBoard> =>
    api.post("/kanban/board", { eventId, name }),
    
  updateBoard: (id: string, name: string) =>
    api.patch(`/kanban/board/${id}`, { name }),
    
  deleteBoard: (id: string) => api.delete(`/kanban/board/${id}`),

  // Columns
  createColumn: (boardId: string, name: string): Promise<KanbanColumn> => 
    api.post("/kanban/column", { boardId, name }),
    
  updateColumn: (id: string, name?: string, order?: number) =>
    api.patch(`/kanban/column/${id}`, { name, order }),
    
  deleteColumn: (id: string) => api.delete(`/kanban/column/${id}`),
  
  reorderColumns: (boardId: string, columnIds: string[]) =>
    api.patch("/kanban/columns/reorder", { boardId, columnIds }),
  
  // Tasks
  createTask: (data: { columnId?: string; title: string; description?: string; priority?: string; deadline?: string }): Promise<KanbanTask> =>
    api.post("/kanban/task", data),
    
  updateTask: (id: string, data: Partial<KanbanTask>) =>
    api.patch(`/kanban/task/${id}`, data),
    
  moveTask: (id: string, targetColumnId: string, order: number) =>
    api.patch(`/kanban/task/${id}/move`, { targetColumnId, order }),
    
  deleteTask: (id: string) =>
    api.delete(`/kanban/task/${id}`),
    
  assignTask: (id: string, userId: string) =>
    api.post(`/kanban/task/${id}/assign`, { userId }),
    
  unassignTask: (id: string, userId: string) =>
    api.delete(`/kanban/task/${id}/assign/${userId}`),
    
  addComment: (id: string, content: string) =>
    api.post(`/kanban/task/${id}/comment`, { content }),
    
  getTaskDetails: (id: string): Promise<any> => api.get(`/kanban/task/${id}`),
  
  getWorkload: (eventId: string): Promise<WorkloadMember[]> => api.get(`/kanban/event/${eventId}/workload`),
};
