"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useDialogBehavior } from "./Modal";

export type DrawerSide = "right" | "left";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

type DrawerContextValue = {
  labelledBy: string;
  describedBy: string;
  onClose: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string) {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error(`<${component}> deve ser usado dentro de <Drawer>`);
  }
  return ctx;
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
  labelledBy?: string;
  describedBy?: string;
  zIndex?: number;
}

/**
 * Drawer primitivo (sheet lateral) com a11y, focus trap, ESC e scroll lock.
 * Compartilha `useDialogBehavior` com Modal.
 */
export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  size = "xl",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  labelledBy,
  describedBy,
  zIndex = 100,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const autoLabelId = useId();
  const autoDescId = useId();

  useDialogBehavior({
    open,
    onClose,
    containerRef: panelRef,
    closeOnEscape,
  });

  const ctx = useMemo<DrawerContextValue>(
    () => ({
      labelledBy: labelledBy ?? `drawer-label-${autoLabelId}`,
      describedBy: describedBy ?? `drawer-desc-${autoDescId}`,
      onClose,
    }),
    [labelledBy, describedBy, onClose, autoLabelId, autoDescId],
  );

  if (!open || typeof window === "undefined") return null;

  const slideIn =
    side === "right"
      ? "slide-in-from-right"
      : "slide-in-from-left";
  const positionSide = side === "right" ? "right-0" : "left-0";
  const borderSide = side === "right" ? "border-l" : "border-r";

  const node = (
    <DrawerContext.Provider value={ctx}>
      <div
        className="fixed inset-0 overflow-hidden animate-in fade-in duration-200"
        style={{ zIndex }}
      >
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="drawer-overlay"
          onClick={closeOnOverlayClick ? onClose : undefined}
          className={clsx(
            "absolute inset-0 w-full h-full cursor-default",
            "bg-black/40 backdrop-blur-sm",
            overlayClassName,
          )}
        />
        <div
          className={clsx(
            "absolute inset-y-0 flex max-w-full",
            positionSide,
            side === "right" ? "pl-10" : "pr-10",
          )}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ctx.labelledBy}
            aria-describedby={ctx.describedBy}
            tabIndex={-1}
            className={clsx(
              "w-screen flex flex-col bg-background shadow-2xl outline-none",
              borderSide,
              "border-border",
              `animate-in ${slideIn} duration-300`,
              SIZE_CLASSES[size],
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </DrawerContext.Provider>
  );

  return createPortal(node, document.body);
}

export interface DrawerHeaderProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

export function DrawerHeader({
  children,
  subtitle,
  showClose = true,
  className,
}: DrawerHeaderProps) {
  const { labelledBy, onClose } = useDrawerContext("Drawer.Header");
  return (
    <div className={clsx("p-6 border-b border-border bg-muted/20", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id={labelledBy}
            className="text-xl font-black tracking-tight uppercase text-foreground"
          >
            {children}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 -mr-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  const { describedBy } = useDrawerContext("Drawer.Body");
  return (
    <div
      id={describedBy}
      className={clsx("flex-1 overflow-y-auto p-6 custom-scrollbar", className)}
    >
      {children}
    </div>
  );
}

export interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div
      className={clsx(
        "p-6 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

Drawer.Header = DrawerHeader;
Drawer.Body = DrawerBody;
Drawer.Footer = DrawerFooter;
