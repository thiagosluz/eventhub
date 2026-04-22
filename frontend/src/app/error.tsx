"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[RootError]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        {error?.digest && (
          <p className="text-xs font-mono text-muted-foreground/70">id: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="primary">Tentar novamente</Button>
          <Link href="/" aria-label="Voltar para a página inicial">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
