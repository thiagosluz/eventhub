"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeftIcon,
  UsersIcon,
  TicketIcon,
  CalendarIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { analyticsService, EventAnalytics } from "@/services/analytics.service";
import Link from "next/link";

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

export default function EventAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchAnalytics = async () => {
      try {
        const result = await analyticsService.getEventAnalytics(id as string);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch event analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Extraindo insights...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar ao Evento
          </button>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Analytics: <span className="text-primary">{data.eventName}</span>
          </h1>
          <p className="text-muted-foreground font-medium">Dados detalhados sobre inscrições e participação.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-card border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total de Inscritos</p>
          <h3 className="text-3xl font-black text-foreground">
            {data.registrationStatus.reduce((sum, s) => sum + s.value, 0)}
          </h3>
        </div>
        <div className="premium-card p-6 bg-card border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Inscrições Pagas</p>
          <h3 className="text-3xl font-black text-emerald-500">
            {data.registrationStatus.find(s => s.name === 'COMPLETED')?.value || 0}
          </h3>
        </div>
        <div className="premium-card p-6 bg-card border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Média de Ocupação</p>
          <h3 className="text-3xl font-black text-primary">
            {Math.round(data.activityParticipation.reduce((sum, a) => sum + a.occupancyRate, 0) / (data.activityParticipation.length || 1))}%
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Registration Growth */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-8 bg-card border-border space-y-6"
        >
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Inscrições Diárias</h2>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Inscrições"
                    stroke="var(--primary)" 
                    strokeWidth={4}
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Participation Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="premium-card p-8 bg-card border-border space-y-6"
        >
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Participação por Atividade</h2>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.activityParticipation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--foreground)' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="enrolled" 
                    name="Inscritos"
                    fill="var(--primary)" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Ticket Distribution Pie */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 bg-card border-border space-y-6"
        >
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Tipos de Ingressos</h2>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ticketDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.ticketDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Registration Status Pie */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 bg-card border-border space-y-6"
        >
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Status das Inscrições</h2>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.registrationStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.registrationStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'COMPLETED' ? '#10B981' : entry.name === 'PENDING' ? '#F59E0B' : '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
