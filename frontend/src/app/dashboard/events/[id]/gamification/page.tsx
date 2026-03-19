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
  QrCodeIcon
} from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";

const BADGE_COLORS = [
  { id: "emerald", name: "Sucesso (Verde)", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20" },
  { id: "blue", name: "Raro (Azul)", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500/20" },
  { id: "purple", name: "Épico (Roxo)", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500/20" },
  { id: "gold", name: "Lendário (Dourado)", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/20" },
  { id: "rose", name: "Especial (Rosa)", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/20" }
];

const TRIGGER_RULES = [
  { id: "MANUAL", name: "Entrega Manual (QR Code / Link)" },
  { id: "RAFFLE_WINNER", name: "Ganhador de Sorteio (Automático)" },
  { id: "EARLY_BIRD", name: "Comprador Pioneiro (Futuro)" },
  { id: "CHECKIN_STREAK", name: "Check-in Múltiplo (Futuro)" }
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
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    fetchEventData();
    fetchBadges();
  }, [id]);

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
    } catch (err) {
      alert("Erro ao criar a conquista.");
    }
  };

  const handleOpenCodes = async (badge: Badge) => {
    setManagingCodesBadge(badge);
    setLoadingCodes(true);
    try {
      const codes = await badgesService.getClaimCodes(badge.id);
      setClaimCodes(codes);
    } catch (err) {
      alert("Erro ao carregar códigos.");
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
            alert("Sucesso! Medalha entregue.");
          } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao entregar");
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
      alert("Erro ao deletar badge.");
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
      <div className="flex items-center justify-between">
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
                Sistema de Conquistas
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-primary italic leading-none mt-1">{event?.name}</p>
            </div>
         </div>
         <button
           onClick={() => setIsCreating(!isCreating)}
           className="premium-button !bg-fuchsia-600 hover:!bg-fuchsia-700 !shadow-fuchsia-200 flex items-center gap-2"
         >
           <PlusIcon className="w-4 h-4" />
           Nova Conquista
         </button>
      </div>

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
                 {(formData.triggerRule === 'EARLY_BIRD' || formData.triggerRule === 'CHECKIN_STREAK') && (
                   <div className="space-y-2 animate-in slide-in-from-left-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {formData.triggerRule === 'EARLY_BIRD' ? 'Nº de Pioneiros' : 'Mínimo de Check-ins'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.minRequirement}
                        onChange={e => setFormData({ ...formData, minRequirement: parseInt(e.target.value) })}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-fuchsia-500 outline-none font-bold text-sm transition-colors"
                      />
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

                      {(badge.triggerRule === 'EARLY_BIRD' || badge.triggerRule === 'CHECKIN_STREAK') && (
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {badge.triggerRule === 'EARLY_BIRD' ? 'Vagas:' : 'Meta:'}
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
    </div>
  );
}
