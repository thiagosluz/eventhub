import { cn } from "@/lib/cn";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-10 w-10 border-4",
};

export function Spinner({
  size = "md",
  className,
  label = "Carregando",
}: {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-primary",
        sizeClasses[size],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
