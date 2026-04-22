"use client";

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useThemeMode } from "@/components/providers/ThemeModeProvider";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedMode, toggle } = useThemeMode();
  const isDark = resolvedMode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border",
        "bg-background text-foreground hover:bg-muted/60 transition-colors",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        className,
      )}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
