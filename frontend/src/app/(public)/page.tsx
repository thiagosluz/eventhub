import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 text-center">
      <div className="space-y-6 max-w-3xl px-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Gerencie e descubra <span className="text-primary">Eventos Incríveis</span>
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          A plataforma completa para organizadores, participantes e avaliadores. 
          De eventos acadêmicos a grandes conferências.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/events">Explorar Eventos</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/organizer">Sou Organizador</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
