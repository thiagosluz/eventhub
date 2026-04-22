"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function MonitorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[MonitorError]", error);
    }
  }, [error]);
  return (
    <div className="p-8 text-center space-y-3">
      <h1 className="text-lg font-bold">Falha ao carregar painel do monitor</h1>
      <Button onClick={reset} variant="primary">Tentar novamente</Button>
    </div>
  );
}
