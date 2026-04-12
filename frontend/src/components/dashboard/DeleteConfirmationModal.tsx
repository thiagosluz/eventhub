import { useState, useEffect } from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (safetyWord?: string) => void;
  title: string;
  description: string;
  isLoading?: boolean;
  requiresSafetyWord?: boolean;
  safetyWord?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
  requiresSafetyWord,
  safetyWord = "DELETAR"
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Reset input when opening/closing
  useEffect(() => {
    if (!isOpen) setInputValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = isLoading || (requiresSafetyWord && inputValue !== safetyWord);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${requiresSafetyWord ? 'bg-orange-500/10 text-orange-500 ring-4 ring-orange-500/5' : 'bg-destructive/10 text-destructive'}`}>
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <h3 className="text-xl font-black mb-2 text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            {description}
          </p>

          {requiresSafetyWord && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-500">Confirmação de Segurança</label>
              <p className="text-[11px] text-muted-foreground font-medium">Digite <span className="text-foreground font-black underline decoration-orange-500">{safetyWord}</span> para confirmar:</p>
              <input 
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={safetyWord}
                className="w-full h-11 bg-muted/50 border border-border rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase"
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/30 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-border bg-card font-bold text-sm hover:bg-muted transition-colors text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(inputValue)}
            disabled={isConfirmDisabled}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isConfirmDisabled 
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                : 'bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20'
            }`}
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
