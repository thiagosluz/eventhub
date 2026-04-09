"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  Building2, 
  ShieldAlert, 
  LayoutDashboard, 
  LogOut,
  UserCheck,
  Activity
} from "lucide-react";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || (!isAuthenticated) || user?.role !== "SUPER_ADMIN") {
    return <div className="h-screen w-full flex items-center justify-center">Carregando painel de admin...</div>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Inquilinos", href: "/admin/tenants", icon: Building2 },
    { name: "Auditoria Global", href: "/admin/audit", icon: ShieldAlert },
    { name: "Saúde do Sistema", href: "/admin/health", icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-yellow-500">
            <ShieldAlert className="w-6 h-6" />
            <span>EventHub<span className="text-white text-xs align-top ml-1">MASTER</span></span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Gestão Global
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-gray-950 rounded-lg border border-gray-800">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-10 overflow-y-auto">
        <header className="h-16 flex-shrink-0 flex items-center px-8 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            ZONA DE RISCO DE DADOS
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
