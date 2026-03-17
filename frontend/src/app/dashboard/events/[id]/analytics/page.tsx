"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeftIcon,
  UsersIcon,
  TicketIcon,
  CalendarIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  UserGroupIcon
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
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsService, EventAnalytics, Participant, Checkin } from "@/services/analytics.service";
import Link from "next/link";

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

type Tab = 'overview' | 'participants' | 'checkins';

export default function EventAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<EventAnalytics | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMounted, setIsMounted] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [activityCheckinFilter, setActivityCheckinFilter] = useState("all");

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const [analyticsResult, participantsResult, checkinsResult] = await Promise.all([
          analyticsService.getEventAnalytics(id as string),
          analyticsService.getEventParticipants(id as string),
          analyticsService.getEventCheckins(id as string)
        ]);
        setData(analyticsResult);
        setParticipants(participantsResult);
        setCheckins(checkinsResult);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTicket = ticketFilter === "all" || p.ticketType === ticketFilter;
      return matchesSearch && matchesTicket;
    });
  }, [participants, searchQuery, ticketFilter]);

  const filteredCheckins = useMemo(() => {
    return checkins.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActivity = activityCheckinFilter === "all" || c.activityName === activityCheckinFilter;
      return matchesSearch && matchesActivity;
    });
  }, [checkins, searchQuery, activityCheckinFilter]);

  const exportToCSV = (type: 'participants' | 'checkins') => {
    let csvContent = "";
    if (type === 'participants') {
      if (filteredParticipants.length === 0) return;
      csvContent = "Nome,Email,Tipo de Ingresso,Status,Data de Inscrição\n" + 
        filteredParticipants.map(p => `${p.name},${p.email},${p.ticketType},${p.ticketStatus},${new Date(p.registrationDate).toLocaleDateString()}`).join("\n");
    } else {
      if (filteredCheckins.length === 0) return;
      csvContent = "Nome,Email,Tipo de Ingresso,Atividade,Data do Check-in\n" + 
        filteredCheckins.map(c => `${c.name},${c.email},${c.ticketType},${c.activityName},${new Date(c.checkedAt).toLocaleString()}`).join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Extraindo insights premium...</p>
      </div>
    );
  }

  if (!data) return null;

  const attendanceRate = data.totalRegistrations > 0 
    ? Math.round((data.totalCheckins / data.totalRegistrations) * 100) 
    : 0;

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
          <p className="text-muted-foreground font-medium">Insights detalhados e gestão de participantes.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'participants' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Inscritos
          </button>
          <button 
            onClick={() => setActiveTab('checkins')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'checkins' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Check-ins
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="premium-card p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inscritos</p>
                  <UsersIcon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-3xl font-black text-foreground">{data.totalRegistrations}</h3>
              </div>
              <div className="premium-card p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Check-ins</p>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-emerald-500">{data.totalCheckins}</h3>
              </div>
              <div className="premium-card p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Comparecimento</p>
                  <UserGroupIcon className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-3xl font-black text-blue-500">{attendanceRate}%</h3>
              </div>
              <div className="premium-card p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Média Ocupação</p>
                  <TicketIcon className="w-4 h-4 text-violet-500" />
                </div>
                <h3 className="text-3xl font-black text-violet-500">
                  {Math.round(data.activityParticipation.reduce((sum, a) => sum + a.occupancyRate, 0) / (data.activityParticipation.length || 1))}%
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Registration Growth */}
              <div className="premium-card p-8 bg-card border-border space-y-6">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Inscrições Diárias
                </h2>
                <div className="h-[300px] w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.dailyRegistrations}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
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
                          tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="var(--primary)" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Participation Comparison */}
              <div className="premium-card p-8 bg-card border-border space-y-6">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Atividades: Inscritos vs Presentes</h2>
                <div className="h-[300px] w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.activityParticipation}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold' }}
                        />
                        <Legend />
                        <Bar dataKey="enrolled" name="Inscritos" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="attended" name="Presentes" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Ticket Distribution */}
              <div className="premium-card p-8 bg-card border-border space-y-6">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Distribuição de Ingressos</h2>
                <div className="h-[300px] w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.ticketDistribution}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.ticketDistribution.map((_, index) => (
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
              </div>

              {/* Registration Status */}
              <div className="premium-card p-8 bg-card border-border space-y-6">
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Status dos Ingressos</h2>
                <div className="h-[300px] w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.registrationStatus}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.registrationStatus.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.name === 'COMPLETED' ? '#10B981' : entry.name === 'PENDING' ? '#F59E0B' : '#EF4444'} 
                            />
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
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'participants' && (
          <motion.div 
            key="participants"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative flex-1 min-w-[300px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/50 border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-muted-foreground" />
                  <select 
                    value={ticketFilter}
                    onChange={(e) => setTicketFilter(e.target.value)}
                    className="bg-muted/50 border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="all">Todos Ingressos</option>
                    <option value="FREE">Gratuito</option>
                    <option value="PAID">Pago</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => exportToCSV('participants')}
                className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-black hover:bg-foreground/90 transition-all shadow-lg active:scale-95"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            <div className="premium-card overflow-hidden bg-card border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Participante</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Atividades</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${p.ticketType === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                            {p.ticketType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${p.ticketStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : p.ticketStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                            {p.ticketStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-foreground">{p.enrollmentsCount} inscr.</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground">{new Date(p.registrationDate).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'checkins' && (
          <motion.div 
            key="checkins"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative flex-1 min-w-[300px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Buscar participante..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/50 border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-muted-foreground" />
                  <select 
                    value={activityCheckinFilter}
                    onChange={(e) => setActivityCheckinFilter(e.target.value)}
                    className="bg-muted/50 border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="all">Todas Atividades</option>
                    <option value="Check-in Geral">Check-in Geral</option>
                    {data.activityParticipation.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={() => exportToCSV('checkins')}
                className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-black hover:bg-foreground/90 transition-all shadow-lg active:scale-95"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            <div className="premium-card overflow-hidden bg-card border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Participante</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Tipo Ticket</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Atividade</th>
                      <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCheckins.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-muted-foreground">{c.ticketType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${c.activityName === 'Check-in Geral' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {c.activityName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-foreground">
                            {new Date(c.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] block text-muted-foreground">
                            {new Date(c.checkedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCheckins.length === 0 && (
                <div className="p-10 text-center space-y-2">
                  <UsersIcon className="w-10 h-10 text-muted/20 mx-auto" />
                  <p className="text-muted-foreground font-bold">Nenhum check-in encontrado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
