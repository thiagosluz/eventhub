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
        <li><a href="/admin/eventos" className="underline focus:outline-none focus:ring-2 focus:ring-ring rounded">Eventos</a></li>
        <li>Programação (em breve)</li>
        <li>Inscrições (em breve)</li>
        <li>Certificados (em breve)</li>
      </ul>
    </section>
  );
}
