"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanTaskCard } from "./KanbanTaskCard";
import { 
  PlusIcon, 
  EllipsisHorizontalIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { kanbanService } from "@/services/kanban.service";
import { ConfirmModal } from "./ConfirmModal";
import toast from "react-hot-toast";
import { KanbanColumn as IKanbanColumn, KanbanTask } from "@/types/kanban";

interface KanbanColumnProps {
  column: IKanbanColumn;
  isHighPriority?: boolean;
  onUpdate: () => void;
  onAddTask: () => void;
  onTaskClick: (task: KanbanTask) => void;
}

export function KanbanColumn({ column, isHighPriority, onUpdate, onAddTask, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = async () => {
    if (!editName.trim() || editName === column.name) {
      setIsEditing(false);
      setEditName(column.name);
      return;
    }
    try {
      await kanbanService.updateColumn(column.id, editName.trim());
      toast.success("Coluna renomeada");
      setIsEditing(false);
      onUpdate();
    } catch {
      toast.error("Erro ao renomear");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await kanbanService.deleteColumn(column.id);
      toast.success("Coluna excluída");
      setShowDeleteConfirm(false);
      onUpdate();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className={`flex flex-col w-80 h-full shrink-0 ${isHighPriority ? 'w-96' : ''}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 mb-4 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") { setIsEditing(false); setEditName(column.name); }
                }}
                className="flex-1 bg-muted/50 border border-primary rounded-lg px-2 py-1 text-xs font-black uppercase tracking-widest text-white focus:outline-none"
              />
              <button onClick={handleRename} className="p-1 text-primary hover:bg-primary/10 rounded-lg">
                <CheckIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setIsEditing(false); setEditName(column.name); }} className="p-1 text-muted-foreground hover:text-rose-500 rounded-lg">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <h3 
                className="text-xs font-black uppercase tracking-widest text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                onDoubleClick={() => setIsEditing(true)}
                title="Duplo-clique para editar"
              >
                {column.name}
              </h3>
              <span className="bg-muted text-[10px] font-black px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
                {column.tasks.length}
              </span>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button 
              onClick={onAddTask}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-gray-300 hover:bg-muted/50 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" /> Renomear
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Body (Droppable) */}
      <div 
        ref={setNodeRef}
        className={`flex-1 min-h-0 overflow-y-auto space-y-3 p-2 rounded-2xl bg-muted/30 border border-transparent transition-all scrollbar-premium ${isHighPriority ? 'bg-muted/50 p-4 space-y-6' : ''}`}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanTaskCard 
              key={task.id} 
              task={task} 
              isHighPriority={isHighPriority} 
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        
        {column.tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-xl opacity-20">
            <span className="text-[10px] font-black uppercase tracking-widest">Vazio</span>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Coluna"
        message={column.tasks?.length > 0 ? `Excluir "${column.name}"? ${column.tasks.length} tarefa(s) serão removidas.` : `Excluir a coluna "${column.name}"?`}
        confirmLabel="Excluir Coluna"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
