"use client";

import { useEffect, useState } from "react";
import { badgesService, Badge, UserBadge } from "@/services/badges.service";
import { TrophyIcon, SparklesIcon, ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge3D } from "./Badge3D";
import confetti from "canvas-confetti";

export function BadgesShowcase() {
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

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
              onClick={() => handleCelebrate(badge)}
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
                description="Mistério... participe das atividades para descobrir como ganhar!"
                color={badge.color}
                iconUrl={undefined}
                eventName={badge.event?.name}
                isEarned={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Celebrate / Share Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedBadge(null)} />
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
             {/* Background glow shadow */}
             <div className="absolute -top-24 -left-24 w-64 h-64 bg-fuchsia-600/20 blur-[100px] rounded-full" />
             <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />

             <button 
               onClick={() => setSelectedBadge(null)}
               className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
             >
               <XMarkIcon className="w-6 h-6" />
             </button>

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

             <div className="flex justify-center scale-110 pointer-events-none">
                <Badge3D 
                  name={selectedBadge.name}
                  description={selectedBadge.description}
                  color={selectedBadge.color}
                  iconUrl={selectedBadge.iconUrl}
                  isEarned={true}
                  eventName={selectedBadge.event?.name}
                />
             </div>

             <div className="space-y-4 pt-4 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Compartilhar no Stories / LinkedIn</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                   <button className="flex-1 min-w-[140px] bg-[#0077B5] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-[#0077B5]/20">
                     <ShareIcon className="w-4 h-4" /> LinkedIn
                   </button>
                   <button className="flex-1 min-w-[140px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-pink-500/20">
                     <ShareIcon className="w-4 h-4" /> Stories
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
