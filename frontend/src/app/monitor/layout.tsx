"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserCircleIcon, ArrowRightOnRectangleIcon, UserIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui";

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-foreground flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-white shadow-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-[40]">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar ao Perfil</span>
          </Link>
          <div className="h-6 w-[1px] bg-border mx-2" />
          <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            Área do Monitor
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tight leading-none text-foreground">{user.name}</p>
                <p className="text-[10px] font-bold text-primary uppercase leading-tight">Monitor</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all border border-border">
                {user.avatarUrl ? (
                  <Image 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    width={36}
                    height={36}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserCircleIcon className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logado como</p>
                    <p className="text-xs font-bold truncate">{user.email}</p>
                  </div>
                  
                  <Link 
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <UserIcon className="w-4 h-4" />
                    Meu Perfil
                  </Link>

                  <button 
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/5 transition-all"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sair do Sistema
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
