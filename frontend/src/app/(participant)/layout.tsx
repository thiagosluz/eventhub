import Link from "next/link"
import { Ticket, LogOut, User, Menu, Bell } from "lucide-react"

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-background sm:flex">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link href="/meus-ingressos" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              E
            </div>
            <span>EventHub</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
            Participante
          </div>
          <Link href="/meus-ingressos" className="flex items-center gap-3 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
            <Ticket className="h-4 w-4" />
            Meus Ingressos
          </Link>
          <Link href="/minhas-submissoes" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <svg 
              className="h-4 w-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Minhas Submissões
          </Link>
        </nav>

        <div className="border-t p-4">
          <Link href="/perfil" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <User className="h-4 w-4" />
            Meu Perfil
          </Link>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 mt-2">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col sm:pl-64">
        {/* Top Header Mobile / General */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
          <button className="sm:hidden text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-medium hidden sm:block">Painel do Participante</h1>
            <div className="flex items-center gap-4 ml-auto">
              <button className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </button>
              <Link href="/evento" className="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Explorar mais eventos
              </Link>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary cursor-pointer hover:bg-primary/30 transition-colors">
                TL
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
