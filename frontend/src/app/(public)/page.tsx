export default function HomePage() {
  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
        Bem-vindo ao EventHub
      </h1>
      <p className="text-muted-foreground max-w-xl mx-auto mb-8">
        Encontre eventos, inscreva-se e gerencie sua participação em um só lugar.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="/evento"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Ver eventos
        </a>
        <a
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Área do organizador
        </a>
      </div>
    </section>
  );
}
