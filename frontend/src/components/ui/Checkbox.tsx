"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, error, className, required, ...props }, ref) => {
    const reactId = useId();
    const inputId = id ?? reactId;
    const describedById = error
      ? `${inputId}-error`
      : description
        ? `${inputId}-description`
        : undefined;

    return (
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedById}
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30",
              error && "border-red-500/60",
              className,
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium text-foreground cursor-pointer select-none"
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
        </div>
        {description && !error && (
          <p
            id={`${inputId}-description`}
            className="text-xs text-muted-foreground ml-6"
          >
            {description}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs font-medium text-red-500 ml-6"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
