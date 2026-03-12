import Link from "next/link";
import { AdminHeaderLinks } from "./admin-header-links";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card" role="banner">
        <nav className="container mx-auto px-4 h-14 flex items-center justify-between gap-6" aria-label="Área do organizador">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded">
              EventHub Admin
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded">
              Voltar ao site
            </Link>
            <Link href="/admin/eventos" className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded">
              Eventos
            </Link>
            <Link href="/admin/certificados" className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded">
              Certificados
            </Link>
          </div>
          <AdminHeaderLinks />
        </nav>
      </header>
      <main id="main" className="flex-1 container mx-auto px-4 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
