"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { Event } from "@/types/event";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { eventsService } from "@/services/events.service";

interface EventActionsDropdownProps {
  event: Event;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const EventActionsDropdown: React.FC<EventActionsDropdownProps> = ({ 
  event, 
  onEventUpdated,
  onEventDeleted,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/events/${event.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const statusText = newStatus === "PUBLISHED" ? "publicado" : "movido para rascunho";
    
    try {
      await eventsService.updateEvent(event.id, { status: newStatus });
      toast.success(`Evento ${statusText} com sucesso!`);
      onEventUpdated();
    } catch (error) {
      toast.error("Erro ao atualizar status do evento.");
    }
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await eventsService.duplicateEvent(event.id);
      toast.success("Evento duplicado com sucesso!");
      onEventUpdated();
    } catch (error) {
      toast.error("Erro ao duplicar evento.");
    } finally {
      setIsDuplicating(false);
      setIsOpen(false);
      onOpenChange?.(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          onOpenChange?.(nextState);
        }}
        className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
        disabled={isDuplicating}
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="py-2">
            <Link 
              href={`/dashboard/events/${event.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Editar Evento
            </Link>

            <button 
              onClick={handleToggleStatus}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left"
            >
              {event.status === "PUBLISHED" ? (
                <>
                  <XCircleIcon className="w-4 h-4 text-amber-500" />
                  Mover para Rascunho
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  Publicar Evento
                </>
              )}
            </button>

            <button 
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              {isDuplicating ? "Duplicando..." : "Duplicar Evento"}
            </button>

            <Link 
              href={`/events/${event.slug}`}
              target="_blank"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Ver Página Pública
            </Link>

            <button 
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left"
            >
              <LinkIcon className="w-4 h-4" />
              Copiar Link
            </button>

            <div className="h-px bg-border my-2" />

            <button 
              onClick={onEventDeleted}
              disabled={event.status === "PUBLISHED"}
              title={event.status === "PUBLISHED" ? "Mova para Rascunho antes de excluir" : ""}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
            >
              <TrashIcon className="w-4 h-4" />
              <div className="flex flex-col">
                <span>Excluir Evento</span>
                {event.status === "PUBLISHED" && (
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-tight">Bloqueado p/ Publicados</span>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
