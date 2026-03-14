"use client";

import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  TicketIcon,
  ArrowUpIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

const stats = [
  { 
    name: "Total de Inscritos", 
    value: "1,248", 
    change: "+12.5%", 
    changeType: "increase", 
    icon: UsersIcon 
  },
  { 
    name: "Receita Total", 
    value: "R$ 45.200", 
    change: "+8.2%", 
    changeType: "increase", 
    icon: CurrencyDollarIcon 
  },
  { 
    name: "Eventos Ativos", 
    value: "4", 
    change: "0%", 
    changeType: "neutral", 
    icon: CalendarIcon 
  },
  { 
    name: "Ingressos Vendidos", 
    value: "852", 
    change: "+5.4%", 
    changeType: "increase", 
    icon: TicketIcon 
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Bora organizar, <span className="text-primary italic">Thiago!</span> 🚀
          </h1>
          <p className="text-muted-foreground font-medium">
            Aqui está o resumo do que está acontecendo com seus eventos hoje.
          </p>
        </div>
        <Link 
          href="/dashboard/events/new"
          className="premium-button !px-6 !py-3 !text-sm !font-black inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Evento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="premium-card p-6 bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <item.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${
                item.changeType === 'increase' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
              }`}>
                {item.changeType === 'increase' && <ArrowUpIcon className="w-3 h-3" />}
                {item.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.name}</p>
              <h3 className="text-2xl font-black text-foreground">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-foreground">Eventos Recentes</h2>
            <Link href="/dashboard/events" className="text-sm font-bold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="premium-card bg-card border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Evento</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Inscritos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-primary font-black">S</div>
                        <span className="font-bold text-foreground">SECOMP 2026</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground">16 Mar, 2026</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 rounded-lg">Ativo</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-1.5 flex-1 max-w-[80px]">
                          <div className="bg-primary h-1.5 rounded-full w-[65%]" />
                        </div>
                        <span className="text-xs font-black text-foreground">412</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-foreground px-2">Atividades Recentes</h2>
          <div className="premium-card p-6 bg-card border-border space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 4 && <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-border" />}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 z-10">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-sm font-bold text-foreground leading-snug">
                    <span className="text-primary">Novo Ingresso:</span> João Silva inscreveu-se no SECOMP.
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">Há 5 minutos</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 text-sm font-black text-muted-foreground hover:text-primary transition-colors bg-muted/30 rounded-xl border border-dashed border-border">
              Carregar mais atividades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
