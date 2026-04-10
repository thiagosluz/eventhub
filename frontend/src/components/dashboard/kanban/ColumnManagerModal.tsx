"use client";

import { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon, 
  Bars3Icon,
  CheckIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { kanbanService } from "@/services/kanban.service";
import { ConfirmModal } from "./ConfirmModal";
import toast from "react-hot-toast";
import { KanbanColumn } from "@/types/kanban";

interface ColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  columns: KanbanColumn[];
  onUpdate: () => void;
}

export function ColumnManagerModal({ isOpen, onClose, boardId, columns: initialColumns, onUpdate }: ColumnManagerModalProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; taskCount: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setColumns([...initialColumns].sort((a, b) => a.order - b.order));
    }
  }, [isOpen, initialColumns]);

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await kanbanService.createColumn(boardId, newColumnName.trim());
      toast.success("Coluna criada");
      setNewColumnName("");
      onUpdate();
    } catch {
      toast.error("Erro ao criar coluna");
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await kanbanService.updateColumn(id, editName.trim());
      toast.success("Coluna renomeada");
      setEditingId(null);
      onUpdate();
    } catch {
      toast.error("Erro ao renomear");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await kanbanService.deleteColumn(deleteTarget.id);
      toast.success("Coluna excluída");
      setDeleteTarget(null);
      onUpdate();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...columns];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setColumns(updated);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      await kanbanService.reorderColumns(boardId, columns.map(c => c.id));
      toast.success("Ordem atualizada");
      onUpdate();
    } catch {
      toast.error("Erro ao reordenar");
    } finally {
      setSaving(false);
    }
  };

  const orderChanged = columns.some((col, i) => col.order !== i);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-lg rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest inline-block mb-2">
              Gerenciar Colunas
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Arraste para reordenar</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors group">
            <XMarkIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-premium">
          {columns.map((col, index) => (
            <div
              key={col.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                dragIndex === index ? "border-primary bg-primary/5 scale-[1.02] shadow-lg" : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <Bars3Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              
              {editingId === col.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(col.id)}
                    className="flex-1 bg-transparent text-sm font-bold focus:outline-none text-foreground"
                  />
                  <button onClick={() => handleRename(col.id)} className="p-1 text-primary hover:bg-primary/10 rounded-lg">
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-rose-500 rounded-lg">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-bold text-foreground">{col.name}</span>
                  <span className="text-[9px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {col.tasks?.length || 0}
                  </span>
                  <button
                    onClick={() => { setEditingId(col.id); setEditName(col.name); }}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: col.id, name: col.name, taskCount: col.tasks?.length || 0 })}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Column */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex gap-2">
            <input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              placeholder="Nova coluna..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-all"
            />
            <button
              onClick={handleAddColumn}
              disabled={!newColumnName.trim()}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" /> Criar
            </button>
          </div>

          {orderChanged && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" /> Salvar Nova Ordem
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir Coluna"
        message={deleteTarget?.taskCount ? `Excluir a coluna "${deleteTarget.name}"? ${deleteTarget.taskCount} tarefa(s) serão removidas permanentemente.` : `Excluir a coluna "${deleteTarget?.name}"?`}
        confirmLabel="Excluir Coluna"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
