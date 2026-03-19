"use client";

import { useState } from "react";
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

interface SecureDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}

export function SecureDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  isLoading 
}: SecureDeleteModalProps) {
  const [confirmValue, setConfirmValue] = useState("");
  const securityWord = "EXCLUIR";

  if (!isOpen) return null;

  const isConfirmed = confirmValue.toUpperCase() === securityWord;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="mx-auto w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
          <ExclamationTriangleIcon className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Excluir Evento?</h2>
          <p className="text-muted-foreground font-medium text-sm leading-relaxed">
            Você está prestes a excluir o evento <strong className="text-foreground">"{title}"</strong>.
            Esta ação é irreversível e excluirá em cascata todas as atividades, inscrições, tickets e medalhas associadas.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Digite <span className="text-destructive">{securityWord}</span> para confirmar
          </p>
          <input 
            type="text"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder="Digite a palavra de segurança"
            className="w-full h-12 px-6 rounded-2xl border border-border bg-muted focus:border-destructive focus:ring-4 focus:ring-destructive/10 transition-all outline-none font-black text-center text-sm uppercase"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button 
            disabled={!isConfirmed || isLoading}
            onClick={onConfirm}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              isConfirmed && !isLoading
                ? "bg-destructive text-white hover:brightness-110 shadow-destructive/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                Confirmar Exclusão Definitiva
              </>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
