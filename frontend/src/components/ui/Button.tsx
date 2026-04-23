"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-md shadow-primary/20 hover:brightness-110 active:scale-[0.98] focus-visible:ring-primary/40",
  secondary:
    "bg-muted text-foreground hover:bg-muted/70 active:scale-[0.98] focus-visible:ring-primary/30",
  outline:
    "border border-border bg-background text-foreground hover:bg-muted/60 active:scale-[0.98] focus-visible:ring-primary/30",
  ghost:
    "text-foreground hover:bg-muted/60 active:scale-[0.98] focus-visible:ring-primary/30",
  destructive:
    "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:brightness-110 active:scale-[0.98] focus-visible:ring-destructive/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200",
          "outline-none focus-visible:ring-4 disabled:opacity-60 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span aria-hidden="true">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
