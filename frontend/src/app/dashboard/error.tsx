"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[DashboardError]", error);
    }
  }, [error]);

  return (
    <div className="p-10 flex items-center justify-center">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-bold tracking-tight">Erro ao carregar painel</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados desta seção.
        </p>
        <div className="pt-3">
          <Button onClick={reset} variant="primary">Recarregar seção</Button>
        </div>
      </div>
    </div>
  );
}
