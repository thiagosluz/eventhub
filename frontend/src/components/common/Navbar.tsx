import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Tenant } from "@/types/event";

export function Navbar({ tenant }: { tenant?: Tenant }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 px-8 sm:px-12 lg:px-16 py-6 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {tenant?.logoUrl ? (
            <Image 
              src={tenant.logoUrl} 
              alt={tenant.name || 'EventHub'} 
              width={36}
              height={36}
              className="rounded-xl object-contain bg-primary shadow-lg p-1" 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          <span className="text-2xl font-bold tracking-tight text-foreground truncate max-w-[200px]">
            {tenant?.name?.split(' ')[0] || 'Event'}<span className="text-primary">{tenant?.name?.split(' ').slice(1).join(' ') || 'Hub'}</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-muted-foreground">
          <Link href="/events" className={`hover:text-primary transition-colors ${pathname === '/events' ? 'text-primary' : ''}`}>Eventos</Link>
          <a href="#" className="hover:text-primary transition-colors">Organizadores</a>
          <a href="#" className="hover:text-primary transition-colors">Preços</a>
          <a href="#" className="hover:text-primary transition-colors">Sobre</a>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link href="/auth/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link href="/auth/register" className="premium-button !px-6 !py-2.5 !text-sm !font-bold">
                Criar Evento
              </Link>
            </>
          ) : (
            <>
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">{user?.name}</span>
                <span className="text-[10px] font-bold text-primary uppercase">
                  {user?.role === 'ORGANIZER' ? 'Organizador' : user?.role === 'REVIEWER' ? 'Revisor' : 'Participante'}
                </span>
              </div>
              <Link 
                href={user?.role === 'ORGANIZER' ? '/dashboard' : user?.role === 'REVIEWER' ? '/dashboard/reviews' : '/profile'} 
                className="text-sm font-black text-muted-foreground hover:text-primary transition-colors px-4 py-2 uppercase tracking-widest"
              >
                {user?.role === 'ORGANIZER' ? 'Dashboard' : user?.role === 'REVIEWER' ? 'Avaliações' : 'Meu Perfil'}
              </Link>
              <button 
                onClick={logout}
                className="premium-button-outline !px-5 !py-2.5 !text-sm !font-bold !border-red-500/20 !text-red-500 hover:!bg-red-500/5"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
