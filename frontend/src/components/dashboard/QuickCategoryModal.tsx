"use client";

import { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { activityTypesService, speakerRolesService } from "@/services/management.service";
import { toast } from "react-hot-toast";

interface QuickCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: { id: string, name: string }) => void;
  type: 'ACTIVITY_TYPE' | 'SPEAKER_ROLE';
}

export function QuickCategoryModal({ isOpen, onClose, onCreated, type }: QuickCategoryModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      let created;
      if (type === 'ACTIVITY_TYPE') {
        created = await activityTypesService.create(name);
        toast.success("Tipo de atividade criado!");
      } else {
        created = await speakerRolesService.create(name);
        toast.success("Papel de palestrante criado!");
      }
      onCreated(created);
      setName("");
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Este item já existe.");
      } else {
        toast.error("Erro ao criar item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black tracking-tight">
            {type === 'ACTIVITY_TYPE' ? 'Novo Tipo de Atividade' : 'Novo Papel de Palestrante'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <XMarkIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quick-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
              Nome do {type === 'ACTIVITY_TYPE' ? 'Tipo' : 'Papel'}
            </label>
            <input
              id="quick-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 focus:border-primary outline-none font-bold text-sm"
              placeholder="Ex: Workshop, Painelista..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full premium-button flex items-center justify-center gap-2 py-3 !text-[10px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                Criar e Utilizar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
