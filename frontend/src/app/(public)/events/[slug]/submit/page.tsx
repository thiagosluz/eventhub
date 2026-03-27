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
  InformationCircleIcon,
  ClockIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("Encerrado"); return; }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

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
  const [modalityId, setModalityId] = useState("");
  const [thematicAreaId, setThematicAreaId] = useState("");
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

  const countdown = useCountdown(event?.submissionEndDate);

  const now = new Date();
  const submissionsDisabled = event && !event.submissionsEnabled;
  const beforeStart = event?.submissionStartDate && now < new Date(event.submissionStartDate);
  const afterEnd = event?.submissionEndDate && now > new Date(event.submissionEndDate);
  const isBlocked = submissionsDisabled || beforeStart || afterEnd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !file || isBlocked) return;

    setSubmitting(true);
    setError(null);

    try {
      await submissionsService.createSubmission({
        eventId: event.id,
        title,
        abstract,
        modalityId: modalityId || undefined,
        thematicAreaId: thematicAreaId || undefined,
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

  // Blocked states
  if (submissionsDisabled) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
          <LockClosedIcon className="w-16 h-16 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Submissões Desativadas</h1>
          <p className="text-muted-foreground text-lg font-medium">O módulo de submissões não está ativo para este evento.</p>
        </div>
        <Link href={`/events/${slug}`} className="premium-button-outline px-8 py-4">Voltar para o Evento</Link>
      </div>
    );
  }

  if (beforeStart) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
          <ClockIcon className="w-16 h-16 text-amber-500" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Submissões Ainda Não Iniciaram</h1>
          <p className="text-muted-foreground text-lg font-medium">
            As submissões abrem em{" "}
            <span className="font-black text-foreground">
              {new Date(event.submissionStartDate!).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        </div>
        <Link href={`/events/${slug}`} className="premium-button-outline px-8 py-4">Voltar para o Evento</Link>
      </div>
    );
  }

  if (afterEnd) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <LockClosedIcon className="w-16 h-16 text-destructive" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Prazo Encerrado</h1>
          <p className="text-muted-foreground text-lg font-medium">O período para submissão de trabalhos já se encerrou.</p>
        </div>
        <Link href={`/events/${slug}`} className="premium-button-outline px-8 py-4">Voltar para o Evento</Link>
      </div>
    );
  }

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

  const modalities = event.submissionModalities || [];
  const areas = event.thematicAreas || [];
  const rules = event.submissionRules || [];

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

      {/* Deadline countdown */}
      {event.submissionEndDate && countdown && countdown !== "Encerrado" && (
        <div className="flex items-center gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <ClockIcon className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-black text-amber-700">Prazo para submissão</p>
            <p className="text-2xl font-black text-amber-600 font-mono tabular-nums">{countdown}</p>
          </div>
        </div>
      )}

      {/* Scientific committee info */}
      {(event.scientificCommitteeHead || event.scientificCommitteeEmail) && (
        <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl">
          <InformationCircleIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground">Comissão Científica</p>
            {event.scientificCommitteeHead && <p className="text-sm text-muted-foreground">Responsável: <span className="font-bold text-foreground">{event.scientificCommitteeHead}</span></p>}
            {event.scientificCommitteeEmail && (
              <a href={`mailto:${event.scientificCommitteeEmail}`} className="text-sm text-primary font-bold hover:underline flex items-center gap-1.5">
                <EnvelopeIcon className="w-4 h-4" /> {event.scientificCommitteeEmail}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Rules & Templates download */}
      {(rules.length > 0 || modalities.some(m => m.templateUrl)) && (
        <div className="premium-card p-6 bg-card border-border space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Documentos Importantes</p>
          <div className="flex flex-wrap gap-3">
            {rules.map(rule => (
              <a key={rule.id} href={rule.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted hover:border-primary/50 transition-all">
                <ArrowDownTrayIcon className="w-4 h-4 text-primary" /> {rule.title}
              </a>
            ))}
            {modalities.filter(m => m.templateUrl).map(mod => (
              <a key={mod.id} href={mod.templateUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted hover:border-primary/50 transition-all">
                <ArrowDownTrayIcon className="w-4 h-4 text-primary" /> Template: {mod.name}
              </a>
            ))}
          </div>
        </div>
      )}

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

          {/* Modality Select */}
          {modalities.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Modalidade</label>
              <select value={modalityId} onChange={e => setModalityId(e.target.value)} className="w-full bg-muted border-none rounded-2xl px-6 py-5 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-bold">
                <option value="">Selecione uma modalidade</option>
                {modalities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.description ? ` — ${m.description}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* Thematic Area Select */}
          {areas.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Área Temática</label>
              <select value={thematicAreaId} onChange={e => setThematicAreaId(e.target.value)} className="w-full bg-muted border-none rounded-2xl px-6 py-5 text-foreground focus:ring-2 focus:ring-primary/50 transition-all font-bold">
                <option value="">Selecione uma área temática</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

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
