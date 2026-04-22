import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-sm font-black uppercase tracking-widest text-primary">404</p>
        <h1 className="text-3xl font-black tracking-tight">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Ir para o início</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">Explorar eventos</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
