"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { id, label, error, helperText, className, required, rows = 4, ...props },
    ref,
  ) => {
    const reactId = useId();
    const textareaId = id ?? reactId;
    const describedById = error
      ? `${textareaId}-error`
      : helperText
        ? `${textareaId}-helper`
        : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-foreground"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium transition-all",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-4",
            error
              ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/15"
              : "border-border focus:border-primary focus:ring-primary/15",
            "resize-y min-h-[80px]",
            className,
          )}
          {...props}
        />
        {error ? (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="text-xs font-medium text-red-500"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
