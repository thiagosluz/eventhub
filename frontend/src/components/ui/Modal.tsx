"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

/**
 * Tamanhos possíveis para o Modal.
 * Controlam o `max-width` do painel centralizado.
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[min(100%-2rem,1200px)]",
};

type ModalContextValue = {
  labelledBy: string;
  describedBy: string;
  onClose: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(component: string) {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error(`<${component}> deve ser usado dentro de <Modal>`);
  }
  return ctx;
}

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

/**
 * Hook compartilhado que aplica:
 * - bloqueio de scroll do body enquanto aberto
 * - fechamento por tecla ESC
 * - focus trap (Tab/Shift+Tab)
 * - foco inicial no primeiro elemento focável
 * - restauração do foco ao fechar
 *
 * Exposto internamente; consumido pelo Modal e Drawer.
 */
export function useDialogBehavior({
  open,
  onClose,
  containerRef,
  closeOnEscape = true,
  trapFocus = true,
  lockScroll = true,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  lockScroll?: boolean;
}) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    previouslyFocused.current = (typeof document !== "undefined"
      ? (document.activeElement as HTMLElement | null)
      : null);

    const container = containerRef.current;
    if (container) {
      const focusables = getFocusable(container);
      const target =
        container.querySelector<HTMLElement>("[data-autofocus='true']") ??
        focusables[0] ??
        container;
      // setTimeout dá chance de elementos animados terminarem de montar.
      const id = window.setTimeout(() => target.focus({ preventScroll: true }), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, containerRef]);

  useEffect(() => {
    if (!open) return;
    return () => {
      const el = previouslyFocused.current;
      if (el && typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || !lockScroll || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, lockScroll]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    function onKeyDown(e: KeyboardEvent) {
      if (closeOnEscape && e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (!trapFocus || e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusable(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeOnEscape, trapFocus, containerRef]);
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  /**
   * Se true, clicar no overlay fecha o modal. Padrão true.
   */
  closeOnOverlayClick?: boolean;
  /**
   * Se true, pressionar ESC fecha o modal. Padrão true.
   */
  closeOnEscape?: boolean;
  /**
   * Classe extra no painel (contêiner interno). Útil para casos excepcionais.
   */
  className?: string;
  /**
   * Classe extra no overlay/backdrop.
   */
  overlayClassName?: string;
  /**
   * Referência explícita ao id usado como `aria-labelledby`.
   * Normalmente populado automaticamente por `ModalHeader`.
   */
  labelledBy?: string;
  /**
   * Referência explícita ao id usado como `aria-describedby`.
   * Normalmente populado automaticamente por `ModalBody`.
   */
  describedBy?: string;
  /**
   * Valor de z-index. Padrão 100. Use maiores para modais sobrepostos.
   */
  zIndex?: number;
}

/**
 * Modal primitivo com a11y: role="dialog", aria-modal, focus trap, ESC, scroll lock.
 * Use com os slots `Modal.Header`, `Modal.Body`, `Modal.Footer` para manter visual
 * consistente. Para casos excepcionais, passe `children` livres.
 */
export function Modal({
  open,
  onClose,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  labelledBy,
  describedBy,
  zIndex = 100,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const autoLabelId = useId();
  const autoDescId = useId();

  useDialogBehavior({
    open,
    onClose,
    containerRef: panelRef,
    closeOnEscape,
  });

  const ctx = useMemo<ModalContextValue>(
    () => ({
      labelledBy: labelledBy ?? `modal-label-${autoLabelId}`,
      describedBy: describedBy ?? `modal-desc-${autoDescId}`,
      onClose,
    }),
    [labelledBy, describedBy, onClose, autoLabelId, autoDescId],
  );

  if (!open || typeof window === "undefined") return null;

  const node = (
    <ModalContext.Provider value={ctx}>
      <div
        className={clsx(
          "fixed inset-0 flex items-center justify-center p-4",
          "animate-in fade-in duration-200",
        )}
        style={{ zIndex }}
      >
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="modal-overlay"
          onClick={closeOnOverlayClick ? onClose : undefined}
          className={clsx(
            "absolute inset-0 w-full h-full cursor-default",
            "bg-black/60 backdrop-blur-sm",
            overlayClassName,
          )}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ctx.labelledBy}
          aria-describedby={ctx.describedBy}
          tabIndex={-1}
          className={clsx(
            "relative w-full rounded-2xl border border-border bg-card text-foreground",
            "shadow-2xl overflow-hidden outline-none",
            "animate-in zoom-in-95 duration-200",
            SIZE_CLASSES[size],
            className,
          )}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(node, document.body);
}

/* --- Slots --- */

export interface ModalHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  /**
   * Variante visual do ícone (controla cor de fundo).
   */
  iconTone?: "primary" | "danger" | "warning" | "success" | "info" | "neutral";
  /**
   * Se true (padrão), renderiza o botão de fechar (X) no canto.
   */
  showClose?: boolean;
  className?: string;
}

const ICON_TONE_CLASSES: Record<NonNullable<ModalHeaderProps["iconTone"]>, string> = {
  primary: "bg-primary/10 text-primary border border-primary/20",
  danger: "bg-destructive/10 text-destructive border border-destructive/20",
  warning: "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border border-[color:var(--color-warning)]/20",
  success: "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border border-[color:var(--color-success)]/20",
  info: "bg-[color:var(--color-info)]/10 text-[color:var(--color-info)] border border-[color:var(--color-info)]/20",
  neutral: "bg-muted text-muted-foreground border border-border",
};

export function ModalHeader({
  children,
  icon,
  iconTone = "primary",
  showClose = true,
  className,
}: ModalHeaderProps) {
  const { labelledBy, onClose } = useModalContext("Modal.Header");
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4 p-6 pb-4",
        className,
      )}
    >
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <div
            className={clsx(
              "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center",
              ICON_TONE_CLASSES[iconTone],
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <h2
          id={labelledBy}
          className="text-xl font-black tracking-tight text-foreground pt-1 min-w-0"
        >
          {children}
        </h2>
      </div>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="p-2 -mr-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  const { describedBy } = useModalContext("Modal.Body");
  return (
    <div id={describedBy} className={clsx("px-6 pb-6 text-sm text-muted-foreground leading-relaxed", className)}>
      {children}
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6",
        "border-t border-border bg-muted/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
