"use client";

import { useEffect, useState } from "react";
import { speakersService, ActivityFeedback } from "@/services/speakers.service";
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function SpeakerFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<ActivityFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      const data = await speakersService.getMyFeedbacks();
      setFeedbacks(data);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverage = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
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
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Média Geral</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-3xl font-black text-foreground">{calculateAverage()}</span>
              <StarIconSolid className="w-5 h-5 text-amber-500 mb-1" />
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avaliações</p>
            <p className="text-3xl font-black text-foreground mt-1">{feedbacks.length}</p>
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
    </div>
  );
}
