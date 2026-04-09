"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { TaskModal } from "./TaskModal";
import { kanbanService } from "@/services/kanban.service";
import toast from "react-hot-toast";
import { KanbanBoard as IKanbanBoard, KanbanTask, WorkloadMember } from "@/types/kanban";

interface KanbanBoardProps {
  board: IKanbanBoard;
  onUpdate: () => void;
  isHighPriority?: boolean;
}

export function KanbanBoard({ board, onUpdate, isHighPriority }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [columns, setColumns] = useState(board?.columns || []);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<WorkloadMember[]>([]);

  useEffect(() => {
    if (board?.columns) {
      setColumns(board.columns);
    }
  }, [board?.columns]);

  useEffect(() => {
    if (board?.eventId) {
      kanbanService.getWorkload(board.eventId).then((data) => setTeamMembers(data as WorkloadMember[]));
    }
  }, [board?.eventId]);

  const handleOpenTask = (task: KanbanTask) => {
    setSelectedTask(task);
    setSelectedColumnId(null);
    setIsModalOpen(true);
  };

  const handleAddTask = (columnId: string) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId);
    setIsModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!board || !board.columns) return null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination columns
    const sourceCol = columns.find((col) => col.tasks.some((t) => t.id === activeId));
    
    // If overid is a task, find its column
    let destCol = columns.find((col) => col.id === overId);
    if (!destCol) {
      destCol = columns.find((col) => col.tasks.some((t) => t.id === overId));
    }

    if (!sourceCol || !destCol) return;

    if (sourceCol.id !== destCol.id || activeId !== overId) {
      try {
        // Optimistic update would be better here, but for now:
        await kanbanService.moveTask(activeId, destCol.id, 0); // Simplified order
        toast.success("Tarefa movida");
        onUpdate();
      } catch {
        toast.error("Erro ao mover tarefa");
      }
    }

    setActiveTask(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = columns.flatMap((c) => c.tasks).find((t) => t.id === active.id);
    setActiveTask(task || null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex gap-6 pb-4 min-h-0 overflow-x-auto h-full scrollbar-premium ${isHighPriority ? 'gap-10' : ''}`}>
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <KanbanColumn 
              key={column.id} 
              column={column} 
              isHighPriority={isHighPriority}
              onUpdate={onUpdate}
              onAddTask={() => handleAddTask(column.id)}
              onTaskClick={handleOpenTask}
            />
          ))}
        </SortableContext>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        columnId={selectedColumnId || undefined}
        eventId={board.eventId}
        teamMembers={teamMembers}
        onUpdate={onUpdate}
      />

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: { active: { opacity: "0.5" } }
        })
      }}>
        {activeTask ? <KanbanTaskCard task={activeTask} isOverlay isHighPriority={isHighPriority} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
