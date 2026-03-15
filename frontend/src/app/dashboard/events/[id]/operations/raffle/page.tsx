"use client";

import { useEffect, useState, use } from "react";
import { operationsService, RaffleWinner } from "@/services/operations.service";
import { 
  ChevronLeftIcon, 
  TrophyIcon, 
  UsersIcon,
  SparklesIcon,
  ArrowPathIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";
import confetti from "canvas-confetti";

export default function RaffleToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");
  const [drawCount, setDrawCount] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getOrganizerEventById(id);
        setEvent(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [id]);

  const handleDraw = async () => {
    setIsDrawing(true);
    setError("");
    
    // Simulate a bit of "suspense"
    await new Promise(r => setTimeout(r, 2000));

    try {
      const response = await operationsService.drawRaffle(id, undefined, drawCount);
      if (response.winners.length === 0) {
        setError("Nenhum participante elegível encontrado (precisa ter feito check-in).");
      } else {
        setWinners(response.winners);
        // Celebration!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399']
        });
      }
    } catch (err: any) {
      setError(err.message || "Erro ao realizar sorteio.");
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href={`/dashboard/events/${id}`}
            className="p-3 rounded-2xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Sorteador de Prêmios</h1>
            <p className="text-xs font-black uppercase tracking-widest text-primary italic leading-none">{event?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
           <div className="px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qtd. Ganhadores</p>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={drawCount}
                onChange={(e) => setDrawCount(parseInt(e.target.value) || 1)}
                className="w-16 bg-transparent border-none outline-none font-black text-primary text-lg"
              />
           </div>
           <button 
             onClick={handleDraw}
             disabled={isDrawing}
             className="premium-button !py-4 !px-8 flex items-center gap-3 disabled:opacity-50"
           >
             {isDrawing ? (
               <ArrowPathIcon className="w-5 h-5 animate-spin" />
             ) : (
               <SparklesIcon className="w-5 h-5" />
             )}
             {isDrawing ? "SORTEANDO..." : "REALIZAR SORTEIO"}
           </button>
        </div>
      </div>

      {/* Main Raffle Area */}
      <div className="w-full max-w-4xl mx-auto">
        {isDrawing ? (
          <div className="premium-card bg-emerald-600 p-24 text-center space-y-8 shadow-2xl shadow-emerald-500/20 animate-pulse relative overflow-hidden">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
             </div>
             
             <TrophyIcon className="w-32 h-32 text-white/40 mx-auto animate-bounce" />
             <div className="space-y-2">
                <h2 className="text-4xl font-black text-white italic tracking-tighter">PREPARANDO O RESULTADO...</h2>
                <p className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Cruzando os dedos para os participantes!</p>
             </div>
          </div>
        ) : winners.length > 0 ? (
          <div className="space-y-8 animate-in zoom-in duration-500">
             <div className="text-center space-y-2">
                <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">🎉 Parabéns aos Vencedores!</h2>
                <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {winners.map((winner, idx) => (
                  <div key={winner.registrationId} className="premium-card p-8 bg-white border-primary/20 border-2 shadow-xl hover:shadow-primary/10 transition-all flex items-center gap-6 group">
                     <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        <TrophyIcon className="w-8 h-8" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ganhador #{idx + 1}</p>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">{winner.userName}</h3>
                        <p className="text-xs font-mono font-bold text-muted-foreground">ID: {winner.registrationId.slice(0, 8)}...</p>
                     </div>
                  </div>
                ))}
             </div>

             <div className="flex justify-center">
                <button 
                  onClick={() => setWinners([])}
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reiniciar Sorteio
                </button>
             </div>
          </div>
        ) : (
          <div className="premium-card p-24 bg-white border-border border-dashed text-center space-y-8">
             {error ? (
               <div className="space-y-4">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                     <XCircleIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{error}</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">Somente participantes que realizaram o check-in no evento podem ser sorteados.</p>
               </div>
             ) : (
               <div className="space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                     <TrophyIcon className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight">Pronto para começar?</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium">Clique no botão acima para realizar um sorteio aleatório entre os participantes presentes.</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="w-full max-w-4xl mx-auto bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border text-primary">
               <UsersIcon className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm font-black text-foreground">Regras do Sorteio</p>
               <p className="text-[10px] text-muted-foreground font-bold">O sistema garante que cada participante seja sorteado apenas uma vez por rodada.</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Operacional e Justo</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
         </div>
      </div>
    </div>
  );
}
