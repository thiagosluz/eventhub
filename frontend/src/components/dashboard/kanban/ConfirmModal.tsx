"use client";

import { ConfirmDialog } from "@/components/ui";

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

/**
 * Wrapper histórico do Kanban. Internamente usa ConfirmDialog.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={() => onConfirm()}
      title={title}
      description={message}
      tone={variant}
      confirmText={confirmLabel ?? (variant === "danger" ? "Excluir" : "Confirmar")}
      cancelText={cancelLabel}
      size="sm"
    />
  );
}
