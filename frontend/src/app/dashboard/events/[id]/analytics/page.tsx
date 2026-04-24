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
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarIconSolid 
} from "@heroicons/react/24/solid";
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
import { analyticsService, EventAnalytics, Participant, Checkin, EventFeedback, EventSpeaker } from "@/services/analytics.service";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui";

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

type Tab = 'overview' | 'participants' | 'checkins' | 'feedbacks';

export default function EventAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<EventAnalytics | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [feedbacks, setFeedbacks] = useState<EventFeedback[]>([]);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [highlights, setHighlights] = useState<import("@/services/analytics.service").FeedbackHighlight[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackAverage, setFeedbackAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isMounted, setIsMounted] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [activityCheckinFilter, setActivityCheckinFilter] = useState("all");
  
  // Feedback Filters
  const [feedbackActivityFilter, setFeedbackActivityFilter] = useState("");
  const [feedbackSpeakerFilter, setFeedbackSpeakerFilter] = useState("");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const [analyticsResult, participantsResult, checkinsResult, speakersResult] = await Promise.all([
          analyticsService.getEventAnalytics(id as string),
          analyticsService.getEventParticipants(id as string),
          analyticsService.getEventCheckins(id as string),
          analyticsService.getEventSpeakers(id as string)
        ]);
        setData(analyticsResult);
        setParticipants(participantsResult);
        setCheckins(checkinsResult);
        setSpeakers(speakersResult);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      const loadFeedbacks = async () => {
        try {
          const [result, highlightsResult] = await Promise.all([
            analyticsService.getEventFeedbacks(id as string, {
              activityId: feedbackActivityFilter,
              speakerId: feedbackSpeakerFilter,
              rating: feedbackRatingFilter ? parseInt(feedbackRatingFilter) : undefined,
              page: feedbackPage,
              limit: 10
            }),
            analyticsService.getEventFeedbackHighlights(id as string)
          ]);
          setFeedbacks(result.data);
          setFeedbackTotal(result.total);
          setFeedbackAverage(result.averageRating);
          setHighlights(highlightsResult);
        } catch (error) {
          console.error("Failed to load feedbacks:", error);
        }
      };
      loadFeedbacks();
    }
  }, [id, activeTab, feedbackActivityFilter, feedbackSpeakerFilter, feedbackRatingFilter, feedbackPage]);

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
          <button 
            onClick={() => setActiveTab('feedbacks')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feedbacks' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
          >
            Feedbacks
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
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
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
              <div className="premium-card p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Média Feedback</p>
                  <StarIconSolid className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-3xl font-black text-amber-500">
                  {data.averageFeedback?.toFixed(1) || "0.0"}
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

            <DataTable<Participant>
              ariaLabel="Participantes do evento"
              data={filteredParticipants}
              columns={[
                {
                  key: "name",
                  header: "Participante",
                  cell: (p) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </div>
                  ),
                },
                {
                  key: "ticketType",
                  header: "Tipo",
                  cell: (p) => (
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                        p.ticketType === "PAID"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}
                    >
                      {p.ticketType}
                    </span>
                  ),
                },
                {
                  key: "ticketStatus",
                  header: "Status",
                  cell: (p) => (
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                        p.ticketStatus === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : p.ticketStatus === "PENDING"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {p.ticketStatus}
                    </span>
                  ),
                },
                {
                  key: "enrollments",
                  header: "Atividades",
                  cell: (p) => (
                    <span className="text-sm font-bold text-foreground">
                      {p.enrollmentsCount} inscr.
                    </span>
                  ),
                },
                {
                  key: "registrationDate",
                  header: "Data",
                  cell: (p) => (
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(p.registrationDate).toLocaleDateString("pt-BR")}
                    </span>
                  ),
                },
              ] as DataTableColumn<Participant>[]}
              rowKey={(p) => p.id}
              emptyTitle="Nenhum participante encontrado"
              emptyIcon={<UsersIcon className="w-6 h-6" />}
            />
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

            <DataTable<Checkin>
              ariaLabel="Check-ins do evento"
              data={filteredCheckins}
              columns={[
                {
                  key: "name",
                  header: "Participante",
                  cell: (c) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </div>
                  ),
                },
                {
                  key: "ticketType",
                  header: "Tipo Ticket",
                  cell: (c) => (
                    <span className="text-xs font-black text-muted-foreground">{c.ticketType}</span>
                  ),
                },
                {
                  key: "activity",
                  header: "Atividade",
                  cell: (c) => (
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                        c.activityName === "Check-in Geral"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.activityName}
                    </span>
                  ),
                },
                {
                  key: "checkedAt",
                  header: "Horário",
                  cell: (c) => (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(c.checkedAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.checkedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ),
                },
              ] as DataTableColumn<Checkin>[]}
              rowKey={(c) => c.id}
              emptyTitle="Nenhum check-in encontrado"
              emptyIcon={<UsersIcon className="w-6 h-6" />}
            />
          </motion.div>
        )}

        {activeTab === 'feedbacks' && (
          <motion.div 
            key="feedbacks"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Highlights Header - Top 3 [Option C] */}
            {highlights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
                {highlights.map((h, idx) => (
                  <div key={h.id} className="premium-card p-5 bg-gradient-to-br from-card to-muted/30 border-primary/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                    <div className="flex items-start justify-between relative">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-1.5">
                          <StarIconSolid className="w-3 h-3" />
                          {idx === 0 ? "Top Favorita" : idx === 1 ? "Melhor Engajamento" : "Destaque do Público"}
                        </p>
                        <h4 className="font-black text-foreground line-clamp-1">{h.title}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground">{h.speakers.join(", ")}</p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center min-w-[50px]">
                        <span className="block text-lg font-black text-amber-600">{h.averageRating.toFixed(1)}</span>
                        <span className="block text-[8px] font-black text-amber-600/60 uppercase">Média</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback Stats & Filters */}
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="bg-card border border-border p-6 rounded-3xl flex items-center gap-8 shadow-sm shrink-0">
                <div className="text-center px-4 border-r border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média Geral</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-4xl font-black text-foreground">{feedbackAverage.toFixed(1)}</span>
                    <StarIconSolid className="w-6 h-6 text-amber-500 mb-1" />
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Avaliações</p>
                  <p className="text-4xl font-black text-foreground mt-1">{feedbackTotal}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Atividade</label>
                  <select 
                    value={feedbackActivityFilter}
                    onChange={(e) => { setFeedbackActivityFilter(e.target.value); setFeedbackPage(1); }}
                    className="w-full bg-muted/50 border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Todas Atividades</option>
                    {data.activityParticipation.map(a => {
                      const isHighRated = highlights.some(h => h.id === a.id);
                      return (
                        <option key={a.id} value={a.id}>
                          {isHighRated ? "⭐ " : ""}{a.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Palestrante</label>
                  <select 
                    value={feedbackSpeakerFilter}
                    onChange={(e) => { setFeedbackSpeakerFilter(e.target.value); setFeedbackPage(1); }}
                    className="w-full bg-muted/50 border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Todos Palestrantes</option>
                    {speakers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nota</label>
                  <select 
                    value={feedbackRatingFilter}
                    onChange={(e) => { setFeedbackRatingFilter(e.target.value); setFeedbackPage(1); }}
                    className="w-full bg-muted/50 border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Todas Notas</option>
                    {[5, 4, 3, 2, 1].map(n => (
                      <option key={n} value={n}>{n} Estrelas</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Feedbacks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feedbacks.length > 0 ? (
                feedbacks.map((fb) => (
                  <div key={fb.id} className="premium-card p-6 bg-card border-border flex flex-col gap-4 group hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-foreground">{fb.userName}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold">{new Date(fb.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-muted/50 px-2 py-1 rounded-lg">
                        <span className="text-sm font-black text-foreground">{fb.rating.toFixed(1)}</span>
                        <StarIconSolid className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                    </div>

                    <div className="flex-1 italic text-muted-foreground text-sm leading-relaxed relative py-2">
                      <span className="text-4xl text-primary/10 absolute -top-4 -left-2 font-serif">"</span>
                      {fb.comment || "Sem comentários, apenas avaliação por estrelas."}
                    </div>

                    <div className="pt-4 border-t border-border/50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fb.activityTitle}</span>
                        </div>
                        {fb.isActivityHighlight && (
                          <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-amber-500/20 animate-pulse">
                            <StarIconSolid className="w-2.5 h-2.5" />
                            Destaque do Público
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground">Palestrantes: {fb.speakers.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                    <ChatBubbleLeftRightIcon className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-black uppercase tracking-widest">Nenhum feedback encontrado com esses filtros</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {feedbackTotal > 10 && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setFeedbackPage(prev => Math.max(1, prev - 1))}
                  disabled={feedbackPage === 1}
                  className="p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-30 transition-all"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="text-sm font-black text-muted-foreground">
                  Página <span className="text-foreground">{feedbackPage}</span> de {Math.ceil(feedbackTotal / 10)}
                </div>
                <button
                  onClick={() => setFeedbackPage(prev => Math.min(Math.ceil(feedbackTotal / 10), prev + 1))}
                  disabled={feedbackPage >= Math.ceil(feedbackTotal / 10)}
                  className="p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-30 transition-all"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
