"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  SwatchIcon, 
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

const tabs = [
  { name: "Geral", href: "/dashboard/settings", icon: AdjustmentsHorizontalIcon },
  { name: "Identidade Visual", href: "/dashboard/settings/branding", icon: SwatchIcon },
  { name: "Perfil Público", href: "/dashboard/settings/profile", icon: UserIcon },
  { name: "Minha Equipe", href: "/dashboard/settings/team", icon: UserGroupIcon },
  { name: "Categorias e Papéis", href: "/dashboard/settings/categories", icon: ShieldCheckIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-8 pb-10">
      {/* Settings Header Hub */}
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Configurações da Organização</h1>
        <p className="text-muted-foreground font-medium">Gerencie a identidade, equipe e preferências globais da sua conta.</p>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        {children}
      </div>
    </div>
  );
}
