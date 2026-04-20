'use client';

import { useEffect, useState, use } from 'react';
import { publicFeedbackService, PublicActivityInfo } from '@/services/public-feedback.service';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline, ChatBubbleBottomCenterTextIcon, CheckCircleIcon, ShareIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function PublicFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: activityId } = use(params);
  const [info, setInfo] = useState<PublicActivityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadInfo();
  }, [activityId]);

  const loadInfo = async () => {
    try {
      const data = await publicFeedbackService.getFeedbackInfo(activityId);
      setInfo(data);
    } catch (error) {
      toast.error('Atividade não encontrada.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setSubmitting(true);
    try {
      await publicFeedbackService.submitFeedback(activityId, { rating, comment });
      setSubmitted(true);
      toast.success('Feedback enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Avaliação: ${info?.title}`,
      text: `Deixe seu feedback para a palestra "${info?.title}" no ${info?.eventName}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Ignorar se o usuário cancelar
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-black mb-2">Ops!</h1>
          <p className="text-muted-foreground">Esta atividade não foi encontrada ou não está disponível para avaliação.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Obrigado!</h1>
            <p className="text-muted-foreground font-medium">Sua avaliação foi enviada e ajudará a melhorar nossas próximas palestras.</p>
          </div>
          <div className="pt-4">
             <div className="p-4 rounded-2xl bg-muted/30 border border-border text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Você avaliou:</p>
                <p className="font-bold">{info.title}</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6 flex flex-col items-center">
      {/* Header com Logo do Tenant */}
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700 relative w-full max-w-md">
        <div className="absolute top-0 right-0">
          <button
            onClick={handleShare}
            className="p-3 bg-card border border-border rounded-2xl shadow-sm text-muted-foreground hover:text-primary transition-colors group"
            title="Compartilhar"
          >
            <ShareIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        {info.tenantLogo && (
          <div className="w-20 h-20 bg-card rounded-2xl shadow-xl border border-border p-3 mx-auto mb-6 flex items-center justify-center relative overflow-hidden group">
            <Image src={info.tenantLogo} alt={info.tenantName} width={80} height={80} className="object-contain" />
          </div>
        )}
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">{info.eventName}</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground">{info.title}</h1>
      </div>

      {/* Card de Avaliação */}
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4">
          <label className="text-sm font-black uppercase tracking-widest text-muted-foreground block text-center">
            Sua nota para esta palestra
          </label>
          
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`transition-all duration-200 transform ${
                  (hover || rating) >= star ? 'scale-125' : 'scale-100'
                }`}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                {(hover || rating) >= star ? (
                  <StarIcon className={`w-12 h-12 ${(hover || rating) >= 4 ? 'text-amber-400' : 'text-primary'}`} />
                ) : (
                  <StarIconOutline className="w-12 h-12 text-muted-foreground/30" />
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
              Comentário (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-2xl p-4 min-h-[120px] outline-none focus:border-primary focus:bg-card transition-all font-medium text-sm"
              placeholder="O que você mais gostou ou o que podemos melhorar?"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Enviar Avaliação'
            )}
          </button>
        </form>

        {/* Info dos Palestrantes */}
        {info.speakers.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-3">
              {info.speakers.map((speaker, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
                  {speaker.avatarUrl ? (
                    <div className="w-6 h-6 rounded-full relative overflow-hidden border border-border">
                      <Image src={speaker.avatarUrl} alt={speaker.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {speaker.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-muted-foreground">{speaker.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
        Powered by EventHub
      </p>
    </div>
  );
}
