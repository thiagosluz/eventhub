"use client";

import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options?: SelectOption[];
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      placeholder,
      options,
      className,
      required,
      children,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const selectId = id ?? reactId;
    const describedById = error
      ? `${selectId}-error`
      : helperText
        ? `${selectId}-helper`
        : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "w-full h-11 rounded-xl border bg-background px-4 text-sm font-medium transition-all",
            "focus:outline-none focus:ring-4",
            error
              ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/15"
              : "border-border focus:border-primary focus:ring-primary/15",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-xs font-medium text-red-500"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
