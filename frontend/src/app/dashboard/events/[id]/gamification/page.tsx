"use client";

import { useEffect, useState, use } from "react";
import { badgesService, Badge } from "@/services/badges.service";
import { eventsService } from "@/services/events.service";
import Link from "next/link";
import { 
  TrophyIcon, 
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  SparklesIcon,
  FireIcon,
  CheckBadgeIcon
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
    iconUrl: "🏆", // Default icon
    customIconUrl: ""
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [_event, _badges] = await Promise.all([
        eventsService.getOrganizerEventById(id),
        badgesService.getEventBadges(id)
      ]);
      setEvent(_event);
      setBadges(_badges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        iconUrl: formData.customIconUrl || formData.iconUrl
      };
      await badgesService.createBadge(id, data);
      setIsCreating(false);
      setFormData({ name: "", description: "", color: "blue", triggerRule: "MANUAL", iconUrl: "🏆", customIconUrl: "" });
      await fetchData();
    } catch (err) {
      alert("Erro ao criar a conquista.");
    }
  };

  const handleDelete = (badgeId: string) => {
    setBadgeToDelete(badgeId);
  };

  const confirmDelete = async () => {
    if (!badgeToDelete) return;
    try {
      await badgesService.deleteBadge(badgeToDelete);
      await fetchData();
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
           <form onSubmit={handleCreate} className="space-y-6">
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

                 <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{trigger}</span>
                 </div>
               </div>
             );
           })}
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
