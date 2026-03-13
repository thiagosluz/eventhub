import Link from "next/link"
import { LayoutDashboard, Ticket, Users, Settings, LogOut, PanelLeft, Calendar } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-background sm:flex">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              E
            </div>
            <span>EventHub</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Pro
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          <Link href="/admin" className="flex items-center gap-3 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </Link>
          <Link href="/admin/eventos" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Calendar className="h-4 w-4" />
            Meus Eventos
          </Link>
          <Link href="/admin/ingressos" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Ticket className="h-4 w-4" />
            Ingressos e Inscrições
          </Link>
          <Link href="/admin/participantes" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Users className="h-4 w-4" />
            Participantes
          </Link>
        </nav>

        <div className="border-t p-4">
          <Link href="/admin/configuracoes" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="h-4 w-4" />
            Configurações
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <button className="sm:hidden text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-medium hidden sm:block">Dashboard</h1>
            <div className="flex items-center gap-4 ml-auto">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                JD
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
