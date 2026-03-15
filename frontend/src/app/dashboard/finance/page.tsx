"use client";

import { useEffect, useState } from "react";
import { 
  CurrencyDollarIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  BanknotesIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import { dashboardService, DashboardStats } from "@/services/dashboard.service";

export default function FinancePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch finance stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Processando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Centro de Finanças</h1>
          <p className="text-muted-foreground font-medium">Controle total sobre suas receitas e transações.</p>
        </div>
        <button className="premium-button !px-6 !py-3 !text-sm !font-black inline-flex items-center gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Exportar Relatório
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="premium-card p-8 bg-primary/5 border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CurrencyDollarIcon className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Saldo Total Bruto</p>
          <h2 className="text-4xl font-black text-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalRevenue ?? 0)}
          </h2>
          <div className="mt-6 flex items-center gap-2 text-emerald-500 text-xs font-black">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Vendas em Tempo Real Ativadas
          </div>
        </div>

        <div className="premium-card p-8 bg-card border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Ingressos Pagos</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-foreground">{stats?.ticketsSold}</h2>
            <BanknotesIcon className="w-8 h-8 text-primary/40 mb-1" />
          </div>
          <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase transition-all">Transações processadas com sucesso</p>
        </div>

        <div className="premium-card p-8 bg-card border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Tickets por Inscrição</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-foreground">
              {stats?.totalRegistrations ? (stats.ticketsSold / stats.totalRegistrations).toFixed(1) : "0"}
            </h2>
            <CreditCardIcon className="w-8 h-8 text-primary/40 mb-1" />
          </div>
          <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase">Média de tickets por pedido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Sales by Event Chart Area (Placeholder for actual chart) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Performance por Evento</h2>
            <ChartBarIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="premium-card p-8 bg-card border-border space-y-8">
            {stats?.eventSales.map((event, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-foreground uppercase tracking-widest">{event.name}</span>
                  <span className="text-xs font-black text-primary italic">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.revenue)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden border border-border/50">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, (event.revenue / (stats.totalRevenue || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Últimas Transações</h2>
            <FunnelIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="premium-card bg-card border-border overflow-hidden">
             <div className="divide-y divide-border">
                {stats?.recentActivities.map((tx, i) => (
                  <div key={i} className="p-6 hover:bg-muted/30 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CreditCardIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground line-clamp-1">{tx.description}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{tx.eventTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-500">+ R$ 0,00</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
