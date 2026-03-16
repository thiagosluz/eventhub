"use client";

import { useEffect, useState } from "react";
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  CalendarIcon, 
  TicketIcon,
  ArrowUpIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dashboardService, DashboardStats } from "@/services/dashboard.service";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "REVIEWER") {
      router.push("/dashboard/reviews");
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, router]);

  const statCards = [
    { 
      name: "Total de Inscritos", 
      value: stats?.totalRegistrations ?? 0, 
      icon: UsersIcon,
      color: "primary"
    },
    { 
      name: "Receita Total", 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalRevenue ?? 0), 
      icon: CurrencyDollarIcon,
      color: "emerald"
    },
    { 
      name: "Eventos Ativos", 
      value: stats?.activeEvents ?? 0, 
      icon: CalendarIcon,
      color: "blue"
    },
    { 
      name: "Ingressos Vendidos", 
      value: stats?.ticketsSold ?? 0, 
      icon: TicketIcon,
      color: "purple"
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando inteligência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Bora organizar, <span className="text-primary italic">{user?.name.split(' ')[0]}!</span> 🚀
          </h1>
          <p className="text-muted-foreground font-medium">
            Aqui está o resumo em tempo real do que está acontecendo hoje.
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
        {statCards.map((item, index) => (
          <motion.div 
            key={item.name} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="premium-card p-6 bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <item.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 uppercase tracking-widest`}>
                <ArrowUpIcon className="w-3 h-3" />
                Live
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.name}</p>
              <h3 className="text-2xl font-black text-foreground">{item.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="premium-card p-8 bg-card border-border"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Crescimento de Vendas</h2>
            <p className="text-xs text-muted-foreground font-medium mt-1">Volume de inscrições e receita nos últimos 30 dias.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/30" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscrições</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.timeSeriesData ?? []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                dy={10}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--primary)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Vendas por Evento</h2>
            <Link href="/dashboard/events" className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver todos</Link>
          </div>
          <div className="premium-card bg-card border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Evento</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Inscrições</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats?.eventSales.map((event, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                          {event.name.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground">{event.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-foreground">{event.sales}</span>
                        <div className="w-full bg-muted rounded-full h-1 max-w-[60px]">
                          <div className="bg-primary h-1 rounded-full w-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-sm text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.revenue)}
                    </td>
                  </tr>
                ))}
                {!stats?.eventSales.length && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                      Nenhum dado de venda disponível.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-foreground px-2 uppercase tracking-tight">Atividades Recentes</h2>
          <div className="premium-card p-8 bg-card border-border space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            {stats?.recentActivities.map((activity, i) => (
              <div key={activity.id} className="flex gap-4 relative">
                {i !== stats.recentActivities.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-gradient-to-b from-border to-transparent" />
                )}
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 z-10 border border-primary/20 shadow-sm">
                  <TicketIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-[13px] font-bold text-foreground leading-snug">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">{new Date(activity.timestamp).toLocaleDateString()}</p>
                    <span className="text-border">•</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{activity.eventTitle}</p>
                  </div>
                </div>
              </div>
            ))}
            {!stats?.recentActivities.length && (
              <p className="text-center text-muted-foreground font-medium italic py-8">Nenhuma atividade recente.</p>
            )}
            <button className="w-full py-4 text-xs font-black text-muted-foreground hover:text-primary hover:border-primary transition-all bg-muted/30 rounded-2xl border border-dashed border-border uppercase tracking-widest">
              Acompanhar Fluxo Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
