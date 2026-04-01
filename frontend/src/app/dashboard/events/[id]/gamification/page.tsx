"use client";

import { useEffect, useState, use, useRef } from "react";
import { badgesService, Badge, BadgeClaimCode } from "@/services/badges.service";
import { Html5Qrcode } from "html5-qrcode";
import { eventsService } from "@/services/events.service";
import Link from "next/link";
import { 
  TrophyIcon, 
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  SparklesIcon,
  FireIcon,
  CheckBadgeIcon,
  QrCodeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";
import { SuccessModal } from "@/components/dashboard/SuccessModal";
import { toast } from "react-hot-toast";
import { analyticsService, GamificationStats, RankingEntry, GamificationAlert, AwardedBadgeHistory } from "@/services/analytics.service";

const BADGE_COLORS = [
  { id: "emerald", name: "Comum (Verde)", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20" },
  { id: "blue", name: "Raro (Azul)", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20" },
  { id: "purple", name: "Épico (Roxo)", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500/20" },
  { id: "gold", name: "Lendário (Dourado)", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20" },
  { id: "rose", name: "Especial (Rosa)", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20" }
];

const TRIGGER_RULES = [
  { id: "MANUAL", name: "Entrega Manual (QR Code / Link)" },
  { id: "RAFFLE_WINNER", name: "Ganhador de Sorteio (Automático)" },
  { id: "EARLY_BIRD", name: "Comprador Pioneiro (Inscrição X)" },
  { id: "CHECKIN_STREAK", name: "Check-in Múltiplo (Atividades X)" },
  { id: "ACTIVITY_HOURS", name: "Horas em Atividades (Mínimo X)" },
  { id: "EVENT_COUNT", name: "Frequência em Eventos (Mínimo X)" },
  { id: "PROFILE_COMPLETED", name: "Perfil Completo (Bio + Avatar)" }
];

const STANDARD_ICONS = [
  { id: "trophy", icon: "🏆" },
  { id: "medal", icon: "🏅" },
  { id: "star", icon: "⭐" },
  { id: "fire", icon: "🔥" },
  { id: "rocket", icon: "🚀" },
  { id: "crown", icon: "👑" },
  { id: "gem", icon: "💎" },
  { id: "heart", icon: "❤️" },
  { id: "bolt", icon: "⚡" },
  { id: "ticket", icon: "🎟️" },
  { id: "target", icon: "🎯" },
  { id: "gift", icon: "🎁" }
];

export default function GamificationDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);
  
  // New Monitoring State
  const [activeTab, setActiveTab] = useState<"dashboard" | "config" | "ranking" | "audit" | "alerts">("dashboard");
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [alerts, setAlerts] = useState<GamificationAlert[]>([]);
  const [history, setHistory] = useState<AwardedBadgeHistory[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Filter States
  const [filterSearch, setFilterSearch] = useState("");
  const [filterBadgeType, setFilterBadgeType] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue",
    triggerRule: "MANUAL",
    manualDeliveryMode: "GLOBAL_CODE" as "SCAN" | "UNIQUE_CODES" | "GLOBAL_CODE",
    iconUrl: "🏆", // Default icon
    customIconUrl: "",
    minRequirement: 0,
    claimCode: "",
    codesCount: 10
  });

  const [managingCodesBadge, setManagingCodesBadge] = useState<Badge | null>(null);
  const [claimCodes, setClaimCodes] = useState<BadgeClaimCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [isScanning, setIsScanning] = useState<Badge | null>(null);
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", description: "" });
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchEventData();
    fetchBadges();
    if (activeTab !== "config") {
      fetchMonitoringData();
    }
  }, [id, activeTab]);

  const fetchEventData = async () => {
    try {
      const _event = await eventsService.getOrganizerEventById(id);
      setEvent(_event);
    } catch (err) {
      console.error("Failed to load event", err);
    }
  };

  const fetchBadges = async () => {
    try {
      const data = await badgesService.getEventBadges(id);
      setBadges(data);
    } catch (err) {
      console.error("Failed to load badges", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    setLoadingStats(true);
    try {
      if (activeTab === "dashboard") {
        const _stats = await analyticsService.getGamificationStats(id);
        setStats(_stats);
      } else if (activeTab === "ranking") {
        const _ranking = await analyticsService.getGamificationRanking(id);
        setRanking(_ranking);
      } else if (activeTab === "alerts") {
        const _alerts = await analyticsService.getGamificationAlerts(id);
        setAlerts(_alerts);
      } else if (activeTab === "audit") {
        const _history = await analyticsService.getAwardedBadgesHistory(id);
        setHistory(_history);
      }
    } catch (err) {
      console.error("Failed to load monitoring data", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await analyticsService.resolveAlert(alertId);
      toast.success("Alerta resolvido.");
      fetchMonitoringData();
    } catch (err) {
      toast.error("Erro ao resolver alerta.");
    }
  };

  const handleRevokeBadge = async (userBadgeId: string) => {
    if (!confirm("Tem certeza que deseja revogar esta conquista?")) return;
    try {
      await analyticsService.revokeBadge(userBadgeId);
      toast.success("Conquista revogada.");
      fetchMonitoringData();
    } catch (err) {
      toast.error("Erro ao revogar conquista.");
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        iconUrl: formData.customIconUrl || formData.iconUrl,
        minRequirement: formData.minRequirement,
        claimCode: formData.claimCode,
        manualDeliveryMode: formData.manualDeliveryMode,
        codesCount: formData.codesCount
      };
      await badgesService.createBadge(id, data);
      setIsCreating(false);
      setFormData({ 
        name: "", 
        description: "", 
        color: "blue", 
        triggerRule: "MANUAL", 
        manualDeliveryMode: "GLOBAL_CODE",
        iconUrl: "🏆", 
        customIconUrl: "", 
        minRequirement: 0, 
        claimCode: "",
        codesCount: 10
      });
      await fetchBadges();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao criar a conquista.");
    }
  };

  const handleOpenCodes = async (badge: Badge) => {
    setManagingCodesBadge(badge);
    setLoadingCodes(true);
    try {
      const codes = await badgesService.getClaimCodes(badge.id);
      setClaimCodes(codes);
    } catch (err) {
      toast.error("Erro ao carregar códigos.");
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleStartScanner = async (badge: Badge) => {
    setIsScanning(badge);
    setTimeout(() => {
      const reader = new Html5Qrcode("badge-scanner-reader");
      scannerRef.current = reader;
      reader.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            await badgesService.awardByScan(badge.id, decodedText);
            setSuccessModal({
              isOpen: true,
              title: "Medalha Entregue!",
              description: `A conquista "${badge.name}" foi atribuída com sucesso ao participante.`
            });
            await stopScanner();
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Erro ao entregar");
          }
        },
        () => {}
      ).catch(err => console.error("Scanner error", err));
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(null);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredRanking = ranking.filter(entry => 
    entry.userName.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.user.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
                         item.user.email.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesBadge = filterBadgeType === "all" || item.badgeId === filterBadgeType;
    
    const earnedAt = new Date(item.earnedAt);
    const matchesStartDate = !filterDateStart || earnedAt >= new Date(filterDateStart);
    const matchesEndDate = !filterDateEnd || earnedAt <= new Date(filterDateEnd + "T23:59:59");
    
    return matchesSearch && matchesBadge && matchesStartDate && matchesEndDate;
  });

  const handleExportRanking = () => {
    const exportData = filteredRanking.map((entry, index) => ({
      Posicao: index + 1,
      Nome: entry.userName,
      XP_Evento: entry.eventXp,
      Nivel_Global: entry.globalLevel
    }));
    downloadCSV(exportData, `ranking-xp-${event?.slug || 'evento'}.csv`);
  };

  const handleExportHistory = () => {
    const exportData = filteredHistory.map(item => ({
      Participante: item.user.name,
      Email: item.user.email,
      Badge: item.badge.name,
      Data: new Date(item.earnedAt).toLocaleString('pt-BR')
    }));
    downloadCSV(exportData, `auditoria-badges-${event?.slug || 'evento'}.csv`);
  };

  const handleDelete = (badgeId: string) => {
    setBadgeToDelete(badgeId);
  };

  const confirmDelete = async () => {
    if (!badgeToDelete) return;
    try {
      await badgesService.deleteBadge(badgeToDelete);
      setBadgeToDelete(null);
      await fetchBadges();
    } catch (err) {
      toast.error("Erro ao deletar badge.");
    } finally {
      setBadgeToDelete(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-bold animate-pulse">Carregando sistema de Gamificação...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/events/${id}`}
              className="p-3 rounded-2xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-fuchsia-500" />
                Monitoramento de Gamificação
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-primary italic leading-none mt-1">{event?.name}</p>
            </div>
         </div>
         {activeTab === "config" && (
           <button
             onClick={() => setIsCreating(!isCreating)}
             className="premium-button !bg-fuchsia-600 hover:!bg-fuchsia-700 !shadow-fuchsia-200 flex items-center gap-2"
           >
             <PlusIcon className="w-4 h-4" />
             Nova Conquista
           </button>
         )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
         <div className="premium-card p-6 bg-white border-fuchsia-500/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-600">
               <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XP Distribuído</p>
               <p className="text-xl font-black">{stats?.totalXpDistributed || 0}</p>
            </div>
         </div>
         <div className="premium-card p-6 bg-white border-blue-500/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
               <TrophyIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Badges Concedidas</p>
               <p className="text-xl font-black">{stats?.totalBadgesAwarded || 0}</p>
            </div>
         </div>
         <div className={`premium-card p-6 bg-white flex items-center gap-4 transition-colors ${stats?.activeAlertsCount ? 'border-rose-500/20 bg-rose-50/30' : 'border-emerald-500/10'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats?.activeAlertsCount ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
               <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alertas Ativos</p>
               <p className={`text-xl font-black ${stats?.activeAlertsCount ? 'text-rose-600' : ''}`}>{stats?.activeAlertsCount || 0}</p>
            </div>
         </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-2xl w-fit max-w-full overflow-x-auto lg:overflow-x-visible no-scrollbar">
         {[
           { id: "dashboard", name: "Dashboard", icon: ChartBarIcon },
           { id: "ranking", name: "Ranking XP", icon: UserGroupIcon },
           { id: "audit", name: "Auditoria", icon: ListBulletIcon },
           { id: "config", name: "Configurar Badges", icon: SparklesIcon },
           { id: "alerts", name: "Alertas", icon: ExclamationTriangleIcon },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
               activeTab === tab.id
                 ? "bg-white text-fuchsia-600 shadow-sm ring-1 ring-border"
                 : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
             }`}
           >
             <tab.icon className="w-4 h-4" />
             {tab.name}
             {tab.id === "alerts" && (stats?.activeAlertsCount || 0) > 0 && (
               <span className="ml-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
             )}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === "dashboard" && (
           <div className="space-y-6">
              <div className="premium-card p-8 bg-white border-fuchsia-500/10">
                 <div className="flex items-center gap-2 mb-6">
                    <ChartBarIcon className="w-5 h-5 text-fuchsia-600" />
                    <h2 className="text-xl font-black uppercase tracking-tight">Visão de Engajamento</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Resumo de Atividade</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border border-border">
                             <div className="flex items-center gap-3">
                                <FireIcon className="w-5 h-5 text-orange-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Média XP / Usuário</span>
                             </div>
                             <span className="text-lg font-black">
                                {stats && stats.totalParticipants > 0 
                                  ? Math.round(stats.totalXpDistributed / stats.totalParticipants) 
                                  : (stats?.totalXpDistributed || 0)}
                              </span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl border border-border">
                             <div className="flex items-center gap-3">
                                <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Badges / Participante</span>
                             </div>
                             <span className="text-lg font-black">
                                {stats && stats.totalParticipants > 0 
                                  ? (stats.totalBadgesAwarded / stats.totalParticipants).toFixed(1) 
                                  : 0}
                              </span>
                          </div>
                       </div>
                    </div>
                    <div className="bg-muted/10 rounded-3xl border border-border p-6 flex flex-col items-center justify-center text-center space-y-4">
                       <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                          <SparklesIcon className="w-8 h-8 text-fuchsia-500" />
                       </div>
                       <div>
                          <h3 className="font-black text-lg">Impulso de Engajamento</h3>
                          <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">
                             Seu evento está com {stats?.totalBadgesAwarded || 0} conquistas desbloqueadas. 
                             Dica: Crie uma badge manual para entregar no palco e aumentar o hype!
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === "ranking" && (
          <div className="premium-card bg-white border-border overflow-hidden">
             <div className="p-6 border-b border-border bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <UserGroupIcon className="w-5 h-5 text-blue-600" />
                   <h2 className="text-lg font-black uppercase tracking-tight">Ranking de XP do Evento</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportRanking} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                       <ArrowDownTrayIcon className="w-3 h-3" /> Exportar CSV
                    </button>
                    <button onClick={fetchMonitoringData} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-border transition-all">
                       <ArrowPathIcon className={`w-4 h-4 text-muted-foreground ${loadingStats ? 'animate-spin' : ''}`} />
                    </button>
                 </div>
             </div>

             {/* Filters Bar */}
             <div className="px-6 py-4 border-b border-border bg-slate-50/30">
                 <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nome do participante..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-all"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                 </div>
              </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-muted/30">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                         <th className="px-6 py-4">Posição</th>
                         <th className="px-6 py-4">Participante</th>
                         <th className="px-6 py-4">XP no Evento</th>
                         <th className="px-6 py-4">Nível Global</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {loadingStats ? (
                        <tr><td colSpan={4} className="p-12 text-center animate-pulse font-bold text-muted-foreground">Calculando ranking...</td></tr>
                      ) : filteredRanking.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium">Nenhum dado de XP registrado para este evento ainda.</td></tr>
                      ) : filteredRanking.map((entry, index) => (
                        <tr key={entry.userId} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${
                                index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                                index === 1 ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                                index === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                                'bg-muted/50 text-muted-foreground border border-border'
                              }`}>
                                 {index + 1}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden">
                                    {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground capitalize">{entry.userName[0]}</div>}
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-foreground">{entry.userName}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-sm font-black text-fuchsia-600">{entry.eventXp} XP</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-200">Level {entry.globalLevel}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="premium-card bg-white border-border overflow-hidden">
             <div className="p-6 border-b border-border bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <ListBulletIcon className="w-5 h-5 text-slate-600" />
                   <h2 className="text-lg font-black uppercase tracking-tight">Histórico de Conquistas</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExportHistory} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                       <ArrowDownTrayIcon className="w-3 h-3" /> Exportar CSV
                    </button>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Últimas Badges Distribuídas</p>
                 </div>
             </div>

             {/* Advanced Filters Bar */}
             <div className="px-6 py-4 border-b border-border bg-slate-50/30 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-1">
                       <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input 
                         type="text" 
                         placeholder="Nome ou email..." 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-all"
                         value={filterSearch}
                         onChange={(e) => setFilterSearch(e.target.value)}
                       />
                    </div>
                    <div className="relative">
                       <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <select 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-all appearance-none"
                         value={filterBadgeType}
                         onChange={(e) => setFilterBadgeType(e.target.value)}
                       >
                          <option value="all">Todas as Badges</option>
                          {badges.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input 
                         type="date" 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-all"
                         value={filterDateStart}
                         onChange={(e) => setFilterDateStart(e.target.value)}
                       />
                    </div>
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input 
                         type="date" 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:ring-2 focus:ring-fuchsia-500/20 focus:outline-none transition-all"
                         value={filterDateEnd}
                         onChange={(e) => setFilterDateEnd(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-muted/30">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                         <th className="px-6 py-4">Participante</th>
                         <th className="px-6 py-4">Badge</th>
                         <th className="px-6 py-4">Data</th>
                         <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {loadingStats ? (
                        <tr><td colSpan={4} className="p-12 text-center animate-pulse font-bold text-muted-foreground text-xs uppercase tracking-widest">Carregando histórico...</td></tr>
                      ) : filteredHistory.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium">Nenhum registro encontrado para os filtros selecionados.</td></tr>
                      ) : filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-foreground">{item.user.name}</span>
                                 <span className="text-[10px] font-medium text-muted-foreground">{item.user.email}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 <span className="text-lg">{item.badge.iconUrl}</span>
                                 <span className="text-xs font-bold">{item.badge.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-[10px] font-medium text-muted-foreground">
                              {new Date(item.earnedAt).toLocaleString('pt-BR')}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRevokeBadge(item.id)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Revogar Conquista"
                              >
                                 <TrashIcon className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-1">
                   <ExclamationTriangleIcon className="w-5 h-5 text-rose-500" />
                   <h2 className="text-lg font-black uppercase tracking-tight">Atividades Suspeitas</h2>
                </div>
             </div>
             
             {loadingStats ? (
               <div className="p-12 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Analisando logs do servidor...</div>
             ) : alerts.length === 0 ? (
               <div className="premium-card p-12 text-center bg-white border-dashed border-emerald-500/20">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                     <CheckBadgeIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-lg">Tudo limpo por aqui!</h3>
                  <p className="text-xs font-medium text-muted-foreground">Nenhuma atividade fora do comum detectada pelo sistema.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`premium-card p-6 bg-white border-2 transition-all ${alert.resolved ? 'border-border grayscale opacity-60' : 'border-rose-500/20 shadow-lg shadow-rose-500/5'}`}>
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.resolved ? 'bg-muted text-muted-foreground' : 'bg-rose-500/10 text-rose-600 animate-pulse'}`}>
                                <ExclamationTriangleIcon className="w-5 h-5" />
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black uppercase tracking-widest py-0.5 px-2 bg-rose-100 text-rose-600 rounded-md">Suspeita de XP Spike</span>
                                   <span className="text-[10px] font-bold text-muted-foreground">{new Date(alert.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                                <h3 className="text-sm font-black mt-1">{alert.message}</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-1">
                                   Usuário: <strong className="text-foreground">{alert.user.name}</strong> ({alert.user.email})
                                </p>
                             </div>
                          </div>
                          {!alert.resolved && (
                             <button
                               onClick={() => handleResolveAlert(alert.id)}
                               className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                             >
                                <CheckBadgeIcon className="w-4 h-4" /> Marcar como Resolvido
                             </button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-8">
            {isCreating && (
              <div className="premium-card p-6 bg-card border-fuchsia-500/20 shadow-xl shadow-fuchsia-500/5 animate-in slide-in-from-top-4">
                 <form onSubmit={handleCreateBadge} className="p-8 space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 border-b border-border pb-4">
                       <SparklesIcon className="w-5 h-5 text-fuchsia-500" />
                       <h2 className="text-lg font-black uppercase tracking-tight">Criar Nova Badge</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Badge</label>
                          <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Sortudo do Ano"
                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Regra (Gatilho)</label>
                          <select
                            value={formData.triggerRule}
                            onChange={e => setFormData({ ...formData, triggerRule: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                          >
                             {TRIGGER_RULES.map(rule => (
                               <option key={rule.id} value={rule.id}>{rule.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</label>
                       <textarea
                         value={formData.description}
                         onChange={e => setFormData({ ...formData, description: e.target.value })}
                         placeholder="Conta um pouco sobre como conseguir isso..."
                         rows={3}
                         className="w-full p-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors resize-none"
                       />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ícone da Badge</label>
                          <span className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setFormData({...formData, customIconUrl: formData.customIconUrl ? "" : "https://"})}>
                             {formData.customIconUrl ? "Escolher da Biblioteca" : "Usar URL Customizada (SVG)"}
                          </span>
                        </div>

                        {formData.customIconUrl ? (
                          <input
                            value={formData.customIconUrl}
                            onChange={e => setFormData({ ...formData, customIconUrl: e.target.value })}
                            placeholder="https://exemplo.com/badge.svg"
                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                          />
                        ) : (
                          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 p-4 bg-muted/20 rounded-[1.5rem] border border-border">
                             {STANDARD_ICONS.map(item => (
                               <button
                                 key={item.id}
                                 type="button"
                                 onClick={() => setFormData({ ...formData, iconUrl: item.icon })}
                                 className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition-all ${
                                   formData.iconUrl === item.icon
                                     ? 'bg-fuchsia-500 text-white shadow-lg scale-110'
                                     : 'bg-white hover:bg-slate-50 border border-border'
                                 }`}
                               >
                                 {item.icon}
                               </button>
                             ))}
                          </div>
                        )}
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cor / Raridade</label>
                       <div className="flex flex-wrap gap-3">
                          {BADGE_COLORS.map(color => (
                             <button
                               key={color.id}
                               type="button"
                               onClick={() => setFormData({ ...formData, color: color.id })}
                               className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                                 formData.color === color.id
                                   ? `${color.border} bg-white shadow-md scale-105 z-10`
                                   : 'border-transparent bg-muted/50 hover:bg-muted text-muted-foreground'
                               }`}
                             >
                                <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                                <span className={`text-xs font-black tracking-tight ${formData.color === color.id ? color.text : ''}`}>
                                  {color.name}
                                </span>
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {(formData.triggerRule === 'EARLY_BIRD' || 
                         formData.triggerRule === 'CHECKIN_STREAK' ||
                         formData.triggerRule === 'ACTIVITY_HOURS' ||
                         formData.triggerRule === 'EVENT_COUNT'
                        ) && (
                          <div className="space-y-2 animate-in slide-in-from-left-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {formData.triggerRule === 'EARLY_BIRD' && 'Nº de Pioneiros'}
                              {formData.triggerRule === 'CHECKIN_STREAK' && 'Mínimo de Check-ins'}
                              {formData.triggerRule === 'ACTIVITY_HOURS' && 'Horas Necessárias'}
                              {formData.triggerRule === 'EVENT_COUNT' && 'Quantidade de Eventos'}
                             </label>
                             <input
                               type="number"
                               step={formData.triggerRule === 'ACTIVITY_HOURS' ? '0.5' : '1'}
                               min={1}
                               value={formData.minRequirement}
                               onChange={e => setFormData({ ...formData, minRequirement: parseFloat(e.target.value) })}
                               className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                             />
                             <p className="text-[10px] font-bold text-muted-foreground italic px-1 pt-1 opacity-70">
                               {formData.triggerRule === 'ACTIVITY_HOURS' && 'Calculado com base na duração agendada das atividades.'}
                               {formData.triggerRule === 'EVENT_COUNT' && 'Considera apenas eventos desta mesma organização.'}
                             </p>
                          </div>
                        )}

                       {formData.triggerRule === 'MANUAL' && (
                         <div className="space-y-4 pt-4 border-t border-border/50">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Modo de Entrega Manual</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                               {[
                                 { id: 'GLOBAL_CODE', label: 'Código Global', desc: 'Um código que todos usam' },
                                 { id: 'UNIQUE_CODES', label: 'Lote de Códigos', desc: 'Vários códigos de uso único' },
                                 { id: 'SCAN', label: 'Scan Inverso', desc: 'Você escaneia o participante' }
                               ].map((mode) => (
                                 <button
                                   key={mode.id}
                                   type="button"
                                   onClick={() => setFormData({ ...formData, manualDeliveryMode: mode.id as any })}
                                   className={`p-4 rounded-2xl border text-left transition-all ${
                                     formData.manualDeliveryMode === mode.id
                                     ? 'border-fuchsia-500 bg-fuchsia-500/5 ring-1 ring-fuchsia-500'
                                     : 'border-border bg-muted/20 hover:border-fuchsia-500/50'
                                   }`}
                                 >
                                   <div className={`text-xs font-black uppercase tracking-widest mb-1 ${formData.manualDeliveryMode === mode.id ? 'text-fuchsia-600' : 'text-foreground'}`}>
                                     {mode.label}
                                   </div>
                                   <p className="text-[10px] font-medium text-muted-foreground leading-tight">{mode.desc}</p>
                                 </button>
                               ))}
                            </div>

                            {formData.manualDeliveryMode === 'GLOBAL_CODE' && (
                              <div className="space-y-2 animate-in slide-in-from-top-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Código de Resgate</label>
                                 <input
                                   value={formData.claimCode}
                                   onChange={e => setFormData({ ...formData, claimCode: e.target.value.toUpperCase() })}
                                   placeholder="Ex: EVENTHUB2026"
                                   className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                                 />
                              </div>
                            )}

                            {formData.manualDeliveryMode === 'UNIQUE_CODES' && (
                              <div className="space-y-2 animate-in slide-in-from-top-2">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantidade de Códigos a Gerar</label>
                                 <input
                                   type="number"
                                   min={1}
                                   max={500}
                                   value={formData.codesCount}
                                   onChange={e => setFormData({ ...formData, codesCount: parseInt(e.target.value) })}
                                   className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                                 />
                                 <p className="text-[10px] font-bold text-muted-foreground italic px-1">O sistema gerará códigos únicos e rastreáveis automaticamente.</p>
                              </div>
                            )}
                         </div>
                       )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                       <button
                         type="submit"
                         className="premium-button !bg-fuchsia-600 hover:!bg-fuchsia-700 !py-3 !px-8"
                       >
                         Criar Badge
                       </button>
                    </div>
                 </form>
              </div>
            )}

            {badges.length === 0 && !isCreating ? (
              <div className="premium-card p-16 text-center space-y-6 bg-card border-dashed">
                 <div className="w-20 h-20 bg-fuchsia-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-fuchsia-500">
                   <FireIcon className="w-10 h-10" />
                 </div>
                 <div className="space-y-2 max-w-sm mx-auto">
                   <h3 className="text-xl font-black text-foreground">Nenhuma Conquista</h3>
                   <p className="text-sm font-medium text-muted-foreground">
                     Dê aos seus participantes motivos para engajar. Crie badges para sorteios, interações e check-in.
                   </p>
                 </div>
                 <button
                   onClick={() => setIsCreating(true)}
                   className="text-fuchsia-600 font-bold hover:underline flex items-center justify-center gap-1 w-full"
                 >
                   <PlusIcon className="w-4 h-4" /> Vamos Criar a Primeira!
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {badges.map(badge => {
                   const scheme = BADGE_COLORS.find(c => c.id === badge.color) || BADGE_COLORS[1];
                   const trigger = TRIGGER_RULES.find(r => r.id === badge.triggerRule)?.name || badge.triggerRule;

                   return (
                     <div key={badge.id} className={`premium-card p-6 bg-white border-2 ${scheme.border} flex flex-col hover:-translate-y-1 transition-transform`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className={`w-14 h-14 rounded-2xl ${scheme.bg} text-white flex items-center justify-center shadow-lg shadow-${scheme.id}-500/30 text-2xl`}>
                             {badge.iconUrl?.startsWith('http') ? (
                               <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8 object-contain" />
                             ) : (
                               <span>{badge.iconUrl || "🏆"}</span>
                             )}
                          </div>
                          <button
                            onClick={() => handleDelete(badge.id)}
                            className="p-2 rounded-xl text-muted-foreground hover:bg-rose-50 hover:text-rose-500 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                       </div>

                       <div className="space-y-1 mt-auto">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${scheme.text}`}>{scheme.name}</p>
                          <h3 className="text-lg font-black">{badge.name}</h3>
                          <p className="text-xs text-muted-foreground font-medium line-clamp-2" title={badge.description}>{badge.description || "Sem descrição."}</p>
                       </div>

                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                           <div className="flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{trigger}</span>
                           </div>

                           {badge.triggerRule === 'MANUAL' && badge.claimCode && (
                             <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código:</span>
                               <span className="text-[10px] font-black text-slate-900 tracking-widest">{badge.claimCode}</span>
                             </div>
                           )}

                             {(badge.triggerRule === 'EARLY_BIRD' || 
                               badge.triggerRule === 'CHECKIN_STREAK' ||
                               badge.triggerRule === 'ACTIVITY_HOURS' ||
                               badge.triggerRule === 'EVENT_COUNT'
                              ) && (
                               <div className="flex items-center justify-between px-1">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                   {badge.triggerRule === 'EARLY_BIRD' && 'Vagas:'}
                                   {badge.triggerRule === 'CHECKIN_STREAK' && 'Check-ins:'}
                                   {badge.triggerRule === 'ACTIVITY_HOURS' && 'Horas:'}
                                   {badge.triggerRule === 'EVENT_COUNT' && 'Eventos:'}
                                 </span>
                                 <span className="text-xs font-black text-slate-900">{badge.minRequirement || 0}</span>
                               </div>
                             )}

                            {badge.triggerRule === 'MANUAL' && (
                              <div className="flex gap-2 pt-2">
                                 {badge.manualDeliveryMode === 'UNIQUE_CODES' && (
                                   <button
                                     onClick={() => handleOpenCodes(badge)}
                                     className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                   >
                                     Ver Códigos
                                   </button>
                                 )}
                                 {badge.manualDeliveryMode === 'SCAN' && (
                                   <button
                                     onClick={() => handleStartScanner(badge)}
                                     className="flex-1 py-2 bg-fuchsia-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-700 transition-colors flex items-center justify-center gap-2"
                                   >
                                     <QrCodeIcon className="w-3 h-3" /> Scanner
                                   </button>
                                 )}
                              </div>
                            )}
                         </div>
                     </div>
                    );
                  })}
               </div>
            )}
          </div>
        )}
      </div>

      {/* Manage Codes Modal */}
      {managingCodesBadge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setManagingCodesBadge(null)} />
           <div className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fuchsia-500/10 text-fuchsia-500 rounded-xl flex items-center justify-center text-xl">
                       {managingCodesBadge.iconUrl}
                    </div>
                    <div>
                       <h3 className="text-lg font-black tracking-tight">{managingCodesBadge.name}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gestão de Códigos Únicos</p>
                    </div>
                 </div>
                 <button onClick={() => setManagingCodesBadge(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <TrashIcon className="w-5 h-5" />
                 </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto border border-border rounded-2xl">
                 <table className="w-full text-left">
                    <thead className="bg-muted/30 sticky top-0">
                       <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <th className="px-6 py-4">Código</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Utilizado Por</th>
                          <th className="px-6 py-4">Data</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                       {loadingCodes ? (
                         <tr><td colSpan={4} className="p-12 text-center text-xs font-bold text-muted-foreground animate-pulse">Carregando códigos...</td></tr>
                       ) : claimCodes.map(c => (
                         <tr key={c.id} className="text-xs font-medium">
                            <td className="px-6 py-4 font-black tracking-widest text-fuchsia-600 font-mono">{c.code}</td>
                            <td className="px-6 py-4">
                               {c.isUsed 
                               ? <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Usado</span>
                               : <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Livre</span>}
                            </td>
                            <td className="px-6 py-4">{c.user?.name || '-'}</td>
                            <td className="px-6 py-4 text-muted-foreground">{c.usedAt ? new Date(c.usedAt).toLocaleDateString() : '-'}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />
           <div className="relative w-full max-w-lg space-y-8 text-center pb-12">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-white tracking-tight">Escanear Participante</h2>
                 <p className="text-slate-400 font-medium">Aponte para o QR Code do ingresso para entregar: <strong className="text-white">"{isScanning.name}"</strong></p>
              </div>

              <div className="premium-card bg-white overflow-hidden aspect-square max-w-[320px] mx-auto shadow-2xl shadow-fuchsia-500/20">
                 <div id="badge-scanner-reader" className="w-full h-full" />
              </div>

              <button 
                onClick={stopScanner}
                className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all"
              >
                Cancelar Scanner
              </button>
           </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={!!badgeToDelete}
        onClose={() => setBadgeToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Conquista"
        description="Tem certeza que deseja excluir esta conquista? Todos os participantes que a desbloquearam também a perderão de seus painéis."
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        description={successModal.description}
      />
    </div>
  );
}
