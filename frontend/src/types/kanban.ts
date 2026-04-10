export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  deadline?: Date | string | null;
  externalReference?: string | null;
  columnId: string;
  assignments?: {
    id: string;
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }[];
  _count?: {
    comments: number;
  };
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  color: string;
  tasks: KanbanTask[];
}

export interface KanbanBoard {
  id: string;
  name: string;
  eventId: string;
  columns: KanbanColumn[];
  _count?: {
    columns: number;
  };
}

export interface WorkloadMember {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  taskCount: number;
}

export interface KanbanFilters {
  search: string;
  memberId: string | null;
  priorities: string[];
  onlyOverdue: boolean;
}
