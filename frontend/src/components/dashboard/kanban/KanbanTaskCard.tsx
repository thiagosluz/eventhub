"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  ChatBubbleLeftRightIcon, 
  CalendarIcon, 
  UserCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KanbanTask } from "@/types/kanban";

interface KanbanTaskCardProps {
  task: KanbanTask;
  isOverlay?: boolean;
  isHighPriority?: boolean;
  onClick?: () => void;
}

export function KanbanTaskCard({ task, isOverlay, isHighPriority, onClick }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const priorityColor = {
    URGENT: "text-rose-500",
    HIGH: "text-orange-500",
    MEDIUM: "text-amber-500",
    LOW: "text-slate-400"
  }[task.priority as string] || "text-slate-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-2xl border-primary ring-2 ring-primary/20 rotate-2' : ''} ${isHighPriority ? 'p-6' : ''}`}
      onClick={(e) => {
        // Only trigger click if not dragging
        if (isDragging) return;
        onClick?.();
      }}
    >
      {/* Drag Handle Overlay for listeners */}
      <div {...attributes} {...listeners} className="absolute inset-0 z-0" />
      
      <div className="relative z-10 pointer-events-none">
      {/* Priority Tag */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${priorityColor}`}>
          <ExclamationCircleIcon className="w-3.5 h-3.5" />
          {task.priority}
        </div>
        {task.externalReference?.startsWith('activity:') && (
          <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase tracking-widest">
            Automático
          </div>
        )}
      </div>

      <h4 className={`font-bold text-foreground leading-tight ${isHighPriority ? 'text-lg' : 'text-sm'}`}>
        {task.title}
      </h4>
      
      {task.description && (
        <p className={`line-clamp-2 mt-2 text-muted-foreground leading-relaxed ${isHighPriority ? 'text-sm line-clamp-3' : 'text-xs'}`}>
          {task.description}
        </p>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          {task.deadline && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${new Date(task.deadline) < new Date() ? 'text-rose-500' : 'text-muted-foreground'}`}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {format(new Date(task.deadline), "dd MMM", { locale: ptBR })}
            </div>
          )}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              {task._count.comments}
            </div>
          )}
        </div>

        {/* Assigned Users Avatars */}
        <div className="flex -space-x-2">
          {task.assignments && task.assignments.length > 0 ? (
            // De-duplicate assignments for rendering to avoid key errors
            Array.from(new Map(task.assignments.map(a => [a.user.id, a])).values()).map((a) => (
              <div key={`${task.id}-assign-${a.user.id}`} className="w-6 h-6 rounded-full border-2 border-card bg-muted overflow-hidden ring-1 ring-border">
                {a.user.avatarUrl ? (
                  <img src={a.user.avatarUrl} alt={a.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase text-muted-foreground">
                    {a.user.name.charAt(0)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div key="none" className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-muted-foreground/30 ring-1 ring-border border-dashed">
              <UserCircleIcon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
