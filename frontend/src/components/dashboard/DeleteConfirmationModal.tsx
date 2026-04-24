"use client";

import { ConfirmDialog } from "@/components/ui";

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

/**
 * Wrapper mantendo a API histórica. Usa ConfirmDialog com tom `danger`
 * e suporte opcional a palavra de segurança.
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
  requiresSafetyWord,
  safetyWord = "DELETAR",
}: DeleteConfirmationModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={(value) => onConfirm(value)}
      title={title}
      description={description}
      tone="danger"
      confirmText="Confirmar Exclusão"
      isLoading={isLoading}
      safetyWord={requiresSafetyWord ? safetyWord : undefined}
    />
  );
}
