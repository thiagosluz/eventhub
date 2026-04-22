import { Spinner } from "@/components/ui";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Carregando…</p>
      </div>
    </div>
  );
}
