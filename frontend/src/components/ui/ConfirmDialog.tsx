"use client";

import { useEffect, useId, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Modal, type ModalSize } from "./Modal";
import { Button } from "./Button";

export type ConfirmDialogTone = "danger" | "warning" | "primary" | "success" | "info";

const TONE_ICON: Record<ConfirmDialogTone, React.ComponentType<{ className?: string }>> = {
  danger: ExclamationTriangleIcon,
  warning: ExclamationTriangleIcon,
  primary: InformationCircleIcon,
  success: CheckCircleIcon,
  info: InformationCircleIcon,
};

const TONE_TO_HEADER: Record<ConfirmDialogTone, "danger" | "warning" | "primary" | "success" | "info"> = {
  danger: "danger",
  warning: "warning",
  primary: "primary",
  success: "success",
  info: "info",
};

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (safetyInput?: string) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmDialogTone;
  isLoading?: boolean;
  size?: ModalSize;
  /**
   * Se definido, exige que o usuário digite exatamente essa palavra
   * antes de habilitar o botão de confirmação.
   */
  safetyWord?: string;
  /**
   * Se `safetyWord` está definido, controla a cor do hint.
   */
  safetyHint?: React.ReactNode;
  /**
   * Oculta o botão de cancelar (útil para diálogos de sucesso).
   */
  hideCancel?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "Cancelar",
  tone = "danger",
  isLoading = false,
  size = "md",
  safetyWord,
  safetyHint,
  hideCancel = false,
}: ConfirmDialogProps) {
  const Icon = TONE_ICON[tone];
  const [value, setValue] = useState("");
  const inputId = useId();

  useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const requiresSafety = Boolean(safetyWord);
  const safetyOk = !requiresSafety || value.trim().toUpperCase() === safetyWord!.toUpperCase();
  const disabled = isLoading || !safetyOk;

  const resolvedConfirmText =
    confirmText ??
    (tone === "success" ? "Entendido" : tone === "danger" ? "Confirmar exclusão" : "Confirmar");

  const confirmVariant: React.ComponentProps<typeof Button>["variant"] =
    tone === "danger" ? "destructive" : "primary";

  return (
    <Modal open={open} onClose={onClose} size={size}>
      <Modal.Header
        icon={<Icon className="w-6 h-6" />}
        iconTone={TONE_TO_HEADER[tone]}
      >
        {title}
      </Modal.Header>
      <Modal.Body>
        {description}
        {requiresSafety && (
          <div className="space-y-3 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <label
              htmlFor={inputId}
              className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--color-warning)]"
            >
              Confirmação de Segurança
            </label>
            <p className="text-[11px] text-muted-foreground font-medium">
              {safetyHint ?? (
                <>
                  Digite{" "}
                  <span className="text-foreground font-black">{safetyWord}</span>{" "}
                  para confirmar:
                </>
              )}
            </p>
            <input
              id={inputId}
              type="text"
              autoFocus
              data-autofocus="true"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={safetyWord}
              className={clsx(
                "w-full h-11 bg-muted/50 border border-border rounded-xl px-4",
                "text-sm font-bold uppercase text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-warning)]/20 focus:border-[color:var(--color-warning)]",
              )}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {!hideCancel && (
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
        )}
        <Button
          variant={confirmVariant}
          isLoading={isLoading}
          disabled={disabled}
          onClick={() => onConfirm(requiresSafety ? value : undefined)}
          data-autofocus={!requiresSafety ? "true" : undefined}
        >
          {resolvedConfirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
