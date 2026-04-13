"use client";

import Link from "next/link";
import { 
  SwatchIcon, 
  UserGroupIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  UserIcon
} from "@heroicons/react/24/outline";

export default function SettingsOverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/settings/branding" className="premium-card group p-8 bg-card border-border hover:border-primary transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <SwatchIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Identidade Visual</h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
              Personalize a aparência do portal para os seus participantes. Altere o logo da organização e as cores de destaque.
            </p>
          </div>
          <div className="flex items-center text-primary font-black text-xs uppercase tracking-widest gap-2">
            Configurar Marca
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/dashboard/settings/profile" className="premium-card group p-8 bg-card border-border hover:border-primary transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserIcon className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Perfil Público</h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
              Edite sua biografia e links de redes sociais. Estas informações aparecem no seu perfil público de organizador.
            </p>
          </div>
          <div className="flex items-center text-emerald-500 font-black text-xs uppercase tracking-widest gap-2">
            Editar Perfil
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/dashboard/settings/team" className="premium-card group p-8 bg-card border-border hover:border-primary transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Minha Equipe</h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
              Convide novos organizadores e monitores para ajudar na gestão dos seus eventos e controle de acesso.
            </p>
          </div>
          <div className="flex items-center text-blue-500 font-black text-xs uppercase tracking-widest gap-2">
            Gerenciar Time
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link href="/dashboard/settings/categories" className="premium-card group p-8 bg-card border-border hover:border-primary transition-all flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Categorias e Papéis</h3>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
              Gerencie os tipos de atividades e papéis de palestrantes disponíveis para sua organização.
            </p>
          </div>
          <div className="flex items-center text-amber-500 font-black text-xs uppercase tracking-widest gap-2">
            Editar Taxonomias
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Proximo Passos / Coming Soon */}
      <div className="pt-8 border-t border-border">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Próximos Módulos</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-muted/30 border border-border border-dashed opacity-60">
            <GlobeAltIcon className="w-6 h-6 text-muted-foreground mb-3" />
            <h5 className="font-bold text-sm mb-1">Integrações</h5>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-black">Em Breve (Stripe, API)</p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/30 border border-border border-dashed opacity-60">
            <ShieldCheckIcon className="w-6 h-6 text-muted-foreground mb-3" />
            <h5 className="font-bold text-sm mb-1">Segurança</h5>
            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-black">Em Breve (MFA, RBAC)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
