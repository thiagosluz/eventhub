"use client";

import { useEffect, useState } from "react";
import { submissionsService } from "@/services/submissions.service";
import { Submission } from "@/types/event";
import { 
  ClipboardDocumentCheckIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronRightIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export function SubmissionsList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await submissionsService.listMySubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error("Failed to fetch submissions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { 
          label: 'Aceito', 
          icon: CheckCircleIcon, 
          className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
        };
      case 'REJECTED':
        return { 
          label: 'Não Aceito', 
          icon: XCircleIcon, 
          className: 'bg-destructive/10 text-destructive border-destructive/20' 
        };
      case 'UNDER_REVIEW':
        return { 
          label: 'Em Revisão', 
          icon: ClockIcon, 
          className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
        };
      default:
        return { 
          label: 'Submetido', 
          icon: ClipboardDocumentCheckIcon, 
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="premium-card p-16 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto">
          <ClipboardDocumentCheckIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Nenhuma submissão encontrada</h2>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm">
            Você ainda não submeteu nenhum trabalho. Explore os eventos abertos para submissão!
          </p>
        </div>
        <Link href="/events" className="premium-button !inline-flex !px-10">Explorar Eventos</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {submissions.map((submission) => {
        const statusConfig = getStatusConfig(submission.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div key={submission.id} className="premium-card p-6 bg-card border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <DocumentIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                    {submission.title}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConfig.className} flex items-center gap-1.5`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusConfig.label}
                  </div>
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  Evento: <span className="text-foreground">{submission.event?.name}</span>
                </p>
                {submission.abstract && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed italic">
                    {submission.abstract}
                  </p>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pt-2 font-mono">
                  Enviado em: {new Date(submission.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <a 
                href={submission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                Ver Arquivo
              </a>
              <Link 
                href={`/events/${submission.event?.slug}`}
                className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
