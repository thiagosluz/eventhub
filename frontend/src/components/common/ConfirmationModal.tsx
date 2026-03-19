"use client";

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading,
  variant = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantClasses = variant === "danger" 
    ? "bg-destructive text-white hover:bg-destructive/90" 
    : "bg-primary text-white hover:bg-primary/90";

  const iconClasses = variant === "danger"
    ? "bg-destructive/10 text-destructive"
    : "bg-primary/10 text-primary";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClasses}`}>
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
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${variantClasses}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
