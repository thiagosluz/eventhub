import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-10 px-6",
        "rounded-2xl border border-dashed border-border bg-muted/20",
        className,
      )}
    >
      {icon && (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
