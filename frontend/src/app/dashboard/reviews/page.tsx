"use client";

import { useEffect, useState } from "react";
import { submissionsService } from "@/services/submissions.service";
import { Review } from "@/types/event";
import { 
  AcademicCapIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function ReviewerDashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Evaluation form state
  const [score, setScore] = useState(3);
  const [recommendation, setRecommendation] = useState("ACCEPT");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await submissionsService.listMyReviews();
        setReviews(data);
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await submissionsService.submitReview({
        submissionId: selectedReview.submissionId,
        score,
        recommendation,
        comments
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedReview(null);
        // Refresh list
        submissionsService.listMyReviews().then(setReviews);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar revisão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const recommendations = [
    { value: "STRONG_ACCEPT", label: "Aceite Forte", color: "text-emerald-600" },
    { value: "ACCEPT", label: "Aceite", color: "text-emerald-500" },
    { value: "WEAK_ACCEPT", label: "Aceite Fraco", color: "text-emerald-400" },
    { value: "BORDERLINE", label: "Borderline", color: "text-amber-500" },
    { value: "WEAK_REJECT", label: "Rejeite Fraco", color: "text-rose-400" },
    { value: "REJECT", label: "Rejeite", color: "text-rose-500" },
    { value: "STRONG_REJECT", label: "Rejeite Forte", color: "text-rose-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Revisões Científicas</h1>
          <p className="text-muted-foreground font-medium mt-1">Gerencie e avalie os trabalhos submetidos para seus eventos.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-4 py-2 rounded-full">
           <AcademicCapIcon className="w-4 h-4" />
           {reviews.length} Trabalhos Designados
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {/* Review deadline banners grouped by event */}
          {(() => {
            const eventDeadlines = new Map<string, { name: string; deadline: string; }>(); 
            reviews.forEach(r => {
              const event = r.submission?.event;
              if (event?.reviewEndDate && !eventDeadlines.has(event.id)) {
                eventDeadlines.set(event.id, { name: event.name, deadline: event.reviewEndDate });
              }
            });
            return Array.from(eventDeadlines.entries()).map(([eventId, info]) => {
              const isExpired = new Date() > new Date(info.deadline);
              return (
                <div key={eventId} className={`flex items-center gap-4 p-4 rounded-2xl border ${isExpired ? 'bg-destructive/10 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  {isExpired ? <LockClosedIcon className="w-5 h-5 text-destructive shrink-0" /> : <ClockIcon className="w-5 h-5 text-amber-600 shrink-0" />}
                  <div>
                    <p className={`text-sm font-black ${isExpired ? 'text-destructive' : 'text-amber-700'}`}>{info.name}</p>
                    <p className={`text-xs font-bold ${isExpired ? 'text-destructive/70' : 'text-amber-600/70'}`}>
                      {isExpired ? 'Prazo de revisão encerrado' : `Prazo: ${new Date(info.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                </div>
              );
            });
          })()}
          {reviews.map((review) => {
            const reviewExpired = review.submission?.event?.reviewEndDate && new Date() > new Date(review.submission.event.reviewEndDate);
            return (
            <div key={review.id} className="premium-card bg-card border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/50 transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {review.submission?.title || "Trabalho sem título"}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {review.submission?.event?.name || "Evento não especificado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                   <span className={`text-xs font-bold uppercase ${review.score ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {review.score ? 'Avaliado' : 'Pendente'}
                   </span>
                </div>
                <button 
                  onClick={() => setSelectedReview(review)}
                  disabled={!!reviewExpired && !review.score}
                  className="premium-button !py-2.5 !px-6 !text-xs !font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewExpired && !review.score ? 'Prazo Encerrado' : review.score ? 'Ver Avaliação' : 'Avaliar'}
                  {reviewExpired && !review.score ? <LockClosedIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="premium-card p-12 bg-card border-border border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <AcademicCapIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Nenhuma revisão pendente</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Você está em dia com suas avaliações ou ainda não foi designado para nenhum trabalho.
            </p>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !isSubmitting && setSelectedReview(null)} />
          <div className="premium-card bg-card border-border w-full max-w-2xl p-8 space-y-8 relative z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <h2 className="text-2xl font-black text-foreground">{selectedReview.submission?.title}</h2>
                 <p className="text-sm text-primary font-bold">{selectedReview.submission?.event?.name}</p>
               </div>
               <a 
                 href={selectedReview.submission?.fileUrl} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-xs font-black rounded-lg hover:bg-primary/20 transition-colors uppercase tracking-widest"
               >
                 <DocumentTextIcon className="w-4 h-4" />
                 Ver PDF
               </a>
            </div>

            {success ? (
               <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
                 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                   <CheckCircleIcon className="w-12 h-12" />
                 </div>
                 <h3 className="text-2xl font-black text-foreground">Revisão Enviada!</h3>
                 <p className="text-muted-foreground font-medium">Obrigado pela sua contribuição científica.</p>
               </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-8">
                {/* Score */}
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <StarIcon className="w-4 h-4" /> Pontuação (1-5)
                  </label>
                  <div className="flex gap-4 items-center justify-center p-6 bg-muted/50 rounded-2xl">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScore(s)}
                        className={`transition-all ${score >= s ? 'text-amber-500 scale-125' : 'text-muted-foreground/30 hover:text-amber-500/50'}`}
                      >
                        <StarIconSolid className="w-10 h-10" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4" /> Recomendação
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {recommendations.map((rec) => (
                      <button
                        key={rec.value}
                        type="button"
                        onClick={() => setRecommendation(rec.value)}
                        className={`px-3 py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${
                          recommendation === rec.value 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" /> Comentários e Feedback
                  </label>
                  <textarea 
                    rows={5}
                    required
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Forneça um feedback construtivo para os autores..."
                    className="w-full bg-muted border-none rounded-2xl px-6 py-5 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3">
                     <InformationCircleIcon className="w-5 h-5" />
                     {error}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                   <button 
                     type="button"
                     onClick={() => setSelectedReview(null)}
                     className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     disabled={isSubmitting}
                     className="flex-[2] premium-button !py-4"
                   >
                     {isSubmitting ? "Enviando..." : "Confirmar Avaliação"}
                   </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
