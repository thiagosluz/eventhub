import Link from "next/link";

export default function EventoListPage() {
  return (
    <section className="container mx-auto px-4 py-12" aria-labelledby="eventos-heading">
      <h1 id="eventos-heading" className="text-2xl font-bold text-foreground mb-4">
        Eventos
      </h1>
      <p className="text-muted-foreground mb-6">
        Para acessar a página de um evento, use o link que você recebeu (ex.:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">/evento/nome-do-evento</code>
        ). Em breve: lista pública de eventos aqui.
      </p>
      <Link
        href="/"
        className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        ← Voltar ao início
      </Link>
    </section>
  );
}
