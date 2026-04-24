"use client";

import { ConfirmDialog } from "@/components/ui";

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

/**
 * Wrapper mantendo a API histórica. Internamente usa `ConfirmDialog`
 * (com tons alinhados aos tokens semânticos e a11y completa do primitivo Modal).
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText,
  isLoading,
  variant = "danger",
}: ConfirmationModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm()}
      title={title}
      description={description}
      tone={variant === "danger" ? "danger" : "primary"}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
    />
  );
}
