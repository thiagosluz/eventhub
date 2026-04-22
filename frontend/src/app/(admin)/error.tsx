"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[AdminError]", error);
    }
  }, [error]);
  return (
    <div className="p-8 text-center space-y-3">
      <h1 className="text-lg font-bold">Falha ao carregar área de administração</h1>
      <Button onClick={reset} variant="primary">Tentar novamente</Button>
    </div>
  );
}
