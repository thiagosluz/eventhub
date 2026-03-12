export default function AdminDashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Dashboard
      </h1>
      <p className="text-muted-foreground mb-6">
        Gerencie seus eventos, inscrições, programação e certificados.
      </p>
      <ul className="list-disc list-inside space-y-2 text-foreground">
        <li><a href="/admin/eventos" className="underline focus:outline-none focus:ring-2 focus:ring-ring rounded">Eventos</a> — criar, editar e publicar eventos</li>
        <li><a href="/admin/certificados" className="underline focus:outline-none focus:ring-2 focus:ring-ring rounded">Certificados</a> — templates e construtor de layout</li>
        <li>Programação (em breve)</li>
        <li>Inscrições (em breve)</li>
      </ul>
    </section>
  );
}
