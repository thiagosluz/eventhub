"use client";

import { ConfirmDialog } from "@/components/ui";

interface SecureDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
}

/**
 * Modal de exclusão segura — requer digitar EXCLUIR para confirmar.
 * Mantém a API histórica; internamente usa ConfirmDialog (primitivo Modal).
 */
export function SecureDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading,
}: SecureDeleteModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm()}
      title="Excluir evento?"
      description={
        <>
          Você está prestes a excluir o evento{" "}
          <strong className="text-foreground">&quot;{title}&quot;</strong>. Essa ação é
          irreversível e removerá em cascata todas as atividades, inscrições,
          tickets e medalhas associadas.
        </>
      }
      tone="danger"
      safetyWord="EXCLUIR"
      confirmText="Confirmar Exclusão Definitiva"
      isLoading={isLoading}
    />
  );
}
