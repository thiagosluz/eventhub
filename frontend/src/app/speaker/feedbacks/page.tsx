"use client";

import { useEffect, useState } from "react";
import { speakersService, ActivityFeedback } from "@/services/speakers.service";
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { ActivitySpeaker } from "@/services/speakers.service";

export default function SpeakerFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<ActivityFeedback[]>([]);
  const [total, setTotal] = useState(0);
  const [globalAverage, setGlobalAverage] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivitySpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [selectedActivity, selectedRating, currentPage]);

  const loadActivities = async () => {
    try {
      const data = await speakersService.getMyActivities();
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      const result = await speakersService.getMyFeedbacks({
        activityId: selectedActivity || undefined,
        rating: selectedRating !== "" ? Number(selectedRating) : undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      // A API agora retorna { data, total, averageRating }
      setFeedbacks(result.data);
      setTotal(result.total);
      setGlobalAverage(result.averageRating);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  const resetFilters = () => {
    setSelectedActivity("");
    setSelectedRating("");
    setCurrentPage(1);
  };

  if (isLoading) return <div className="h-64 bg-card rounded-3xl animate-pulse" />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Feedback & Avaliações</h1>
          <p className="text-muted-foreground mt-1">
            Veja o que os participantes estão dizendo sobre suas apresentações.
          </p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-6 shadow-sm">
          <div className="text-center px-4 border-r border-border">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Média Geral</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-foreground">{globalAverage?.toFixed(1) || "0.0"}</span>
                <StarIconSolid className="w-5 h-5 text-amber-500 mb-1" />
              </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avaliações</p>
            <p className="text-3xl font-black text-foreground mt-1">{total}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FunnelIcon className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest">Filtros Avançados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Atividade</label>
            <select
              value={selectedActivity}
              onChange={(e) => { setSelectedActivity(e.target.value); setCurrentPage(1); }}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="">Todas as atividades</option>
              {activities.map((item) => (
                <option key={item.activityId} value={item.activityId}>
                  {item.activity.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Avaliação (Estrelas)</label>
            <select
              value={selectedRating}
              onChange={(e) => { setSelectedRating(e.target.value === "" ? "" : Number(e.target.value)); setCurrentPage(1); }}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="">Todas as notas</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} Estrela{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {(selectedActivity || selectedRating) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 px-4 py-3 rounded-xl transition-all w-full md:w-auto"
              >
                <XMarkIcon className="w-4 h-4" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-[2.5rem] p-20 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Nenhuma avaliação ainda</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Os feedbacks aparecerão aqui assim que os participantes começarem a avaliar suas sessões.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="premium-card p-6 bg-card border-border hover:border-primary/20 transition-all flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-primary uppercase tracking-tight line-clamp-1">{fb.activity.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">{new Date(fb.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    s <= fb.rating ? (
                      <StarIconSolid key={s} className="w-4 h-4 text-amber-500" />
                    ) : (
                      <StarIcon key={s} className="w-4 h-4 text-border" />
                    )
                  ))}
                </div>
              </div>

              <div className="flex-1 italic text-muted-foreground text-sm leading-relaxed relative">
                <span className="text-4xl text-primary/10 absolute -top-4 -left-2 font-serif">"</span>
                {fb.comment || "Participante não deixou comentários, apenas a avaliação por estrelas."}
                <span className="text-4xl text-primary/10 absolute -bottom-8 -right-0 font-serif">"</span>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center gap-2">
                 <AcademicCapIcon className="w-4 h-4 text-muted-foreground" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Participante Anônimo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-3 rounded-2xl border border-border hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                  currentPage === i + 1 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="p-3 rounded-2xl border border-border hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
