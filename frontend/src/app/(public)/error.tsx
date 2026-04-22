"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[PublicError]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Não foi possível carregar esta página</h1>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro ao carregar o conteúdo. Tente novamente.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} variant="primary">Tentar novamente</Button>
          <Link href="/">
            <Button variant="outline">Página inicial</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
