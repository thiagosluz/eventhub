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
    ? "bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20" 
    : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20";

  const iconClasses = variant === "danger"
    ? "bg-red-500/10 text-red-500 border border-red-500/20"
    : "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-950/95 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${iconClasses}`}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-xl transition-colors group"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
            </button>
          </div>

          <h3 className="text-xl font-black text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-6 bg-gray-900/50 border-t border-gray-800/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl border border-gray-800 bg-gray-900 font-bold text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-12 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${variantClasses}`}
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
