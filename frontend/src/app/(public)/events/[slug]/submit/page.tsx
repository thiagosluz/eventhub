"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { eventsService } from "@/services/events.service";
import { submissionsService } from "@/services/submissions.service";
import { Event } from "@/types/event";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SubmitWorkPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getPublicEventBySlug(slug);
        setEvent(data);
      } catch (e) {
        console.error("Failed to fetch event:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !file) return;

    setSubmitting(true);
    setError(null);

    try {
      await submissionsService.createSubmission({
        eventId: event.id,
        title,
        abstract,
        file
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Falha ao enviar submissão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!event) return <div className="p-12 text-center text-destructive">Evento não encontrado.</div>;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircleIcon className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Submissão Enviada!</h1>
          <p className="text-muted-foreground text-lg font-medium">Seu trabalho foi enviado com sucesso e entrará em fase de revisão em breve.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link href={`/events/${slug}`} className="premium-button-outline px-8 py-4">Voltar para o Evento</Link>
          <Link href="/tickets" className="premium-button px-8 py-4">Ver Meus Ingressos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
      <div className="space-y-4">
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar para {event.name}
        </Link>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Submissão de Trabalho</h1>
        <p className="text-muted-foreground font-medium">Preencha os dados abaixo para submeter seu trabalho científico ao evento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="premium-card p-8 md:p-12 bg-card border-border space-y-8">
          {/* Title Field */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Título do Trabalho</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Análise de Performance em Sistemas Distribuídos"
              className="w-full bg-muted border-none rounded-2xl px-6 py-5 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 transition-all font-bold"
            />
          </div>

          {/* Abstract Field */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Resumo / Abstract</label>
            <textarea 
              rows={6}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Descreva brevemente seu trabalho..."
              className="w-full bg-muted border-none rounded-2xl px-6 py-5 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 transition-all font-bold"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Arquivo (PDF)</label>
            <div className={`relative group border-2 border-dashed rounded-3xl p-12 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <input 
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                required
              />
              <div className="space-y-4 flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${file ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                  {file ? <DocumentTextIcon className="w-8 h-8" /> : <CloudArrowUpIcon className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {file ? file.name : "Clique ou arraste seu PDF"}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Tamanho máximo: 10MB"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3">
             <InformationCircleIcon className="w-5 h-5" />
             {error}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={submitting || !file}
            className="premium-button !px-12 !py-5 !text-lg !font-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Finalizar Submissão
                <CheckCircleIcon className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
