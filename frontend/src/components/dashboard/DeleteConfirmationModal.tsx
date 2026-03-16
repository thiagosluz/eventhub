"use client";

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <h3 className="text-xl font-black mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-border bg-card font-bold text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-destructive text-white font-bold text-sm hover:bg-destructive/90 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Confirmar Exclusão"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
