"use client";

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = variant === "danger"
    ? { icon: "bg-rose-500/10 text-rose-500", btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" }
    : { icon: "bg-amber-500/10 text-amber-500", btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-950/95 w-full max-w-sm rounded-2xl border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center shrink-0`}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">{message}</p>
            </div>
            <button onClick={onCancel} className="p-1.5 hover:bg-gray-900 rounded-lg transition-colors shrink-0">
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-800/50 bg-gray-900/30">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.97] ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
