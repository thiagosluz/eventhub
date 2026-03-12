export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border" role="banner">
        <nav className="container mx-auto px-4 h-14 flex items-center gap-6" aria-label="Principal">
          <a href="/" className="font-semibold text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring">
            EventHub
          </a>
          <a href="/evento" className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded">
            Eventos
          </a>
        </nav>
      </header>
      <main id="main" className="flex-1" role="main">
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground" role="contentinfo">
        EventHub — Gestão de eventos
      </footer>
    </div>
  );
}
