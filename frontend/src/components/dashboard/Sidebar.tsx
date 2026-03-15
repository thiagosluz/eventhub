"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  CalendarIcon, 
  UsersIcon, 
  CreditCardIcon, 
  Cog6ToothIcon,
  AcademicCapIcon,
  ChevronLeftIcon,
  PlusIcon,
  UserIcon, // Added UserIcon
  ChartBarIcon // Added ChartBarIcon
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Visão Geral", href: "/dashboard", icon: HomeIcon },
  { name: "Meus Eventos", href: "/dashboard/events", icon: CalendarIcon },
  { name: "Palestrantes", href: "/dashboard/speakers", icon: UserIcon }, // Changed to UserIcon
  { name: "Branding", href: "/dashboard/settings/branding", icon: ChartBarIcon }, // Added new item
  { name: "Inscritos", href: "/dashboard/participants", icon: UsersIcon },
  { name: "Revisões", href: "/dashboard/reviews", icon: AcademicCapIcon },
  { name: "Financeiro", href: "/dashboard/finance", icon: CreditCardIcon },
  { name: "Configurações", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Event<span className="text-primary">Hub</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <Link 
          href="/dashboard/events/new"
          className="premium-button w-full !py-3 !text-xs !font-black flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Criar Novo Evento
        </Link>
      </div>
    </div>
  );
}
