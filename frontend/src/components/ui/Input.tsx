"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      className,
      required,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? reactId;
    const describedById = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-foreground"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className={cn("relative flex items-center", leftAddon && "pl-0")}>
          {leftAddon && (
            <span
              className="absolute left-3 inline-flex items-center text-muted-foreground"
              aria-hidden="true"
            >
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedById}
            className={cn(
              "w-full h-11 rounded-xl border bg-background px-4 text-sm font-medium transition-all",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-4",
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/15"
                : "border-border focus:border-primary focus:ring-primary/15",
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              className,
            )}
            {...props}
          />
          {rightAddon && (
            <span
              className="absolute right-3 inline-flex items-center text-muted-foreground"
              aria-hidden="true"
            >
              {rightAddon}
            </span>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
