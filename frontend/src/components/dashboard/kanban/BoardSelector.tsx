"use client";

import { useState } from "react";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  ViewColumnsIcon
} from "@heroicons/react/24/outline";
import { kanbanService } from "@/services/kanban.service";
import { ConfirmModal } from "./ConfirmModal";
import toast from "react-hot-toast";
import { KanbanBoard } from "@/types/kanban";

interface BoardSelectorProps {
  boards: KanbanBoard[];
  activeBoardId: string | null;
  eventId: string;
  onBoardSelect: (boardId: string) => void;
  onBoardsChange: () => void;
}

export function BoardSelector({ boards, activeBoardId, eventId, onBoardSelect, onBoardsChange }: BoardSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const board = await kanbanService.createBoard(eventId, newName.trim()) as KanbanBoard;
      toast.success("Quadro criado");
      setIsCreating(false);
      setNewName("");
      onBoardsChange();
      onBoardSelect(board.id);
    } catch {
      toast.error("Erro ao criar quadro");
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await kanbanService.updateBoard(id, editName.trim());
      toast.success("Quadro renomeado");
      setEditingId(null);
      onBoardsChange();
    } catch {
      toast.error("Erro ao renomear");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await kanbanService.deleteBoard(deleteTarget.id);
      toast.success("Quadro excluído");
      setDeleteTarget(null);
      onBoardsChange();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-premium pb-1">
      <ViewColumnsIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      
      {boards.map((board) => (
        <div key={board.id} className="relative group shrink-0">
          {editingId === board.id ? (
            <div className="flex items-center gap-1 bg-muted/50 border border-primary rounded-xl px-2 py-1">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(board.id)}
                className="bg-transparent text-xs font-bold w-24 focus:outline-none text-white"
              />
              <button onClick={() => handleRename(board.id)} className="p-0.5 hover:text-primary text-muted-foreground">
                <CheckIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingId(null)} className="p-0.5 hover:text-rose-500 text-muted-foreground">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onBoardSelect(board.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                activeBoardId === board.id
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {board.name}
              <span className="text-[9px] opacity-60">{board._count?.columns || 0}</span>
            </button>
          )}

          {/* Hover Actions */}
          {editingId !== board.id && (
            <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-0.5 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(board.id); setEditName(board.name); }}
                className="p-1 bg-card border border-border rounded-full shadow-lg hover:bg-muted transition-colors"
                title="Renomear"
              >
                <PencilIcon className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
              {boards.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: board.id, name: board.name }); }}
                  className="p-1 bg-card border border-border rounded-full shadow-lg hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                  title="Excluir"
                >
                  <TrashIcon className="w-2.5 h-2.5 text-muted-foreground hover:text-rose-500" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Create New Board */}
      {isCreating ? (
        <div className="flex items-center gap-1 bg-muted/50 border border-primary/30 rounded-xl px-3 py-1 shrink-0">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Nome do quadro..."
            className="bg-transparent text-xs font-bold w-32 focus:outline-none text-white placeholder:text-muted-foreground"
          />
          <button onClick={handleCreate} className="p-0.5 hover:text-primary text-muted-foreground">
            <CheckIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setIsCreating(false); setNewName(""); }} className="p-0.5 hover:text-rose-500 text-muted-foreground">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Novo Quadro
        </button>
      )}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir Quadro"
        message={`Excluir o quadro "${deleteTarget?.name}"? Todas as colunas e tarefas serão removidas permanentemente.`}
        confirmLabel="Excluir Quadro"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
