'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CalendarDays, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Settings, 
  Ticket, 
  Users 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { logoutAction } from '@/actions/auth.actions';

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
    { name: 'Eventos', href: '/organizer/events', icon: CalendarDays },
    { name: 'Participantes', href: '/organizer/attendees', icon: Users },
    { name: 'Vendas', href: '/organizer/sales', icon: Ticket },
    { name: 'Configurações', href: '/organizer/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.assign('/login');
  };

  const renderNavLinks = (onClick?: () => void) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive 
                ? 'bg-muted text-primary' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-6 w-6 text-primary" />
              <span className="">EventHub Organizador</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
              {renderNavLinks()}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none">{user?.email}</span>
                <span className="text-xs text-muted-foreground">Admin do Tenant</span>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Mobile Header */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger className="shrink-0 md:hidden flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium mt-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-6"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CalendarDays className="h-6 w-6 text-primary" />
                  <span className="sr-only">EventHub</span>
                </Link>
                {renderNavLinks(() => setIsMobileMenuOpen(false))}
              </nav>
              <div className="mt-auto pt-6 border-t">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:hidden">Painel do Organizador</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
