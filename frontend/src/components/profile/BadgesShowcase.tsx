"use client";

import { useEffect, useState } from "react";
import { badgesService, Badge, UserBadge } from "@/services/badges.service";
import { TrophyIcon, SparklesIcon, ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge3D } from "./Badge3D";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import { toPng } from "html-to-image";
import { useRef as reactUseRef } from "react";

export function BadgesShowcase() {
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [claimingBadge, setClaimingBadge] = useState<Badge | null>(null);
  const [claimCode, setClaimCode] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const badgeRef = reactUseRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await badgesService.getAvailableBadges();
      setAvailableBadges(data);
    } catch (err) {
      console.error("Failed to load badges", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCelebrate = (badge: Badge) => {
    setSelectedBadge(badge);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#3b82f6']
    });
  };

  const onBadgeClick = (badge: Badge) => {
    if (badge.isEarned) {
      handleCelebrate(badge);
    } else if (badge.triggerRule === 'MANUAL') {
      setClaimingBadge(badge);
    } else {
      toast("Esta conquista é secreta! Continue participando para desbloquear.", { icon: "🤫" });
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingBadge || !claimCode) return;
    
    setIsSubmittingClaim(true);
    try {
      await badgesService.claimBadge(claimingBadge.id, claimCode);
      toast.success("Conquista desbloqueada!");
      setClaimingBadge(null);
      setClaimCode("");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Código inválido ou erro ao resgatar.");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const getUnlockTip = (badge: Badge) => {
    if (badge.triggerRule === 'MANUAL') return "Clique para resgatar com seu código!";
    if (badge.triggerRule === 'EVENT_COUNT') return `Participe de pelo menos ${badge.minRequirement || 1} eventos para desbloquear.`;
    if (badge.triggerRule === 'ACTIVITY_HOURS') return `Participe de ${badge.minRequirement || 0} horas de atividades para desbloquear.`;
    if (badge.triggerRule === 'PROFILE_COMPLETED') return "Complete seu perfil (Bio de 50+ caracteres e Foto) para desbloquear.";
    if (badge.triggerRule === 'CHECKIN_STREAK') return `Faça check-in em ${badge.minRequirement || 1} atividades para desbloquear.`;
    if (badge.triggerRule === 'EARLY_BIRD') return "Seja um dos primeiros a se inscrever no evento!";
    return "Mistério... continue participando para descobrir como ganhar!";
  };

  const earned = availableBadges.filter(b => b.isEarned);
  const locked = availableBadges.filter(b => !b.isEarned);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando Sala de Troféus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2 tracking-tight">
            🏆 Gabinete de Conquistas
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Coleção de medalhas e troféus desbloqueados em eventos.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
          {earned.length} Conquistas
        </div>
      </div>

      {/* Earned Badges Section */}
      {earned.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {earned.map((badge) => (
            <Badge3D 
              key={badge.id}
              name={badge.name}
              description={badge.description}
              color={badge.color}
              iconUrl={badge.iconUrl}
              eventName={badge.event?.name}
              isEarned={true}
              onClick={() => onBadgeClick(badge)}
            />
          ))}
        </div>
      ) : (
        <div className="premium-card p-16 text-center space-y-6 bg-card border-dashed">
           <div className="w-24 h-24 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto text-fuchsia-500">
             <TrophyIcon className="w-12 h-12" />
           </div>
           <div className="space-y-2 max-w-sm mx-auto">
             <h3 className="text-2xl font-black text-foreground tracking-tight">Gabinete Vazio</h3>
             <p className="text-sm font-medium text-muted-foreground">
               Ainda não há medalhas para exibir. Participe de eventos e interaja para começar sua coleção!
             </p>
           </div>
        </div>
      )}

      {/* Locked / Mysterious Badges Section */}
      {locked.length > 0 && (
        <div className="space-y-8 pt-8 border-t border-border">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-6 bg-slate-300 rounded-full" />
             <h3 className="text-lg font-black uppercase tracking-tight text-slate-500">Desafios Pendentes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {locked.map((badge) => (
              <Badge3D 
                key={badge.id}
                name={badge.name}
                description={getUnlockTip(badge)}
                color={badge.color}
                iconUrl={undefined}
                eventName={badge.event?.name}
                isEarned={false}
                onClick={() => onBadgeClick(badge)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimingBadge && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setClaimingBadge(null)} />
           <div className="relative w-full max-w-md bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                    <SparklesIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black tracking-tight">Resgatar Conquista</h3>
                 <p className="text-sm text-muted-foreground">Insira o código secreto para desbloquear <strong>{claimingBadge.name}</strong>.</p>
              </div>

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                 <input 
                   autoFocus
                   required
                   value={claimCode}
                   onChange={e => setClaimCode(e.target.value.toUpperCase())}
                   placeholder="CÓDIGO SECRETO"
                   className="w-full h-14 bg-muted/50 border border-border rounded-xl px-4 text-center font-black tracking-[0.3em] outline-none focus:border-primary transition-colors"
                 />
                 <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setClaimingBadge(null)}
                      className="flex-1 h-12 rounded-xl font-bold text-sm hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={isSubmittingClaim || !claimCode}
                      className="flex-[2] h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                    >
                      {isSubmittingClaim ? "Validando..." : "Desbloquear"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Celebrate / Share Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedBadge(null)} />
          
          <div className="relative w-full max-w-lg text-center shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
             <button 
               onClick={() => setSelectedBadge(null)}
               className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors z-20"
             >
               <XMarkIcon className="w-6 h-6" />
             </button>

             <div ref={badgeRef} className="p-10 space-y-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden">
                {/* Background glows for the captured image */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-fuchsia-600/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />

                <div className="space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <SparklesIcon className="w-3 h-3" /> Conquista Desbloqueada
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-none px-4">
                      Parabéns!
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">
                      Você conquistou <strong className="text-white">"{selectedBadge.name}"</strong> no evento {selectedBadge.event?.name}.
                    </p>
                </div>

                <div className="flex justify-center scale-110 pointer-events-none pb-8 pt-4">
                    <Badge3D 
                      name={selectedBadge.name}
                      description={selectedBadge.description}
                      color={selectedBadge.color}
                      iconUrl={selectedBadge.iconUrl}
                      isEarned={true}
                      eventName={selectedBadge.event?.name}
                      forceGlow={true}
                    />
                </div>
             </div>

             <div className="space-y-4 pt-4 relative z-10 w-full px-10">
                <button 
                  onClick={async () => {
                    if (badgeRef.current) {
                      try {
                        const dataUrl = await toPng(badgeRef.current, {
                          cacheBust: true,
                          style: { borderRadius: '2.5rem' }
                        });
                        const link = document.createElement('a');
                        link.download = `medalha-${selectedBadge.name.toLowerCase()}.png`;
                        link.href = dataUrl;
                        link.click();
                        toast.success("Imagem baixada!");
                      } catch (err) {
                        toast.error("Erro ao gerar imagem.");
                      }
                    }
                  }}
                  className="w-full bg-primary text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  <TrophyIcon className="w-4 h-4" /> Baixar Medalha (PNG)
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
