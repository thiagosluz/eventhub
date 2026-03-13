import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                E
              </div>
              <span className="inline-block font-bold md:text-lg">
                EventHub
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/evento" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Descobrir Eventos
              </Link>
              <Link href="#features" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Para Organizadores
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="hidden md:inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Entrar
            </Link>
            <Link 
              href="/cadastro" 
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Criar Evento Grátis
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1 flex flex-col" role="main">
        {children}
      </main>
      <footer className="border-t border-border bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-bold text-lg">EventHub</span>
            <p className="text-sm text-muted-foreground">
              A plataforma definitiva para criar, gerenciar e escalar seus eventos.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Recursos</Link></li>
              <li><Link href="#" className="hover:text-foreground">Preços</Link></li>
              <li><Link href="#" className="hover:text-foreground">Casos de Uso</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Ajuda</Link></li>
              <li><Link href="#" className="hover:text-foreground">Comunidade</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Privacidade</Link></li>
              <li><Link href="#" className="hover:text-foreground">Termos</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} EventHub Inc. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
