"use client";

import { useEffect, useState, use } from "react";
import { certificatesService } from "@/services/certificates.service";
import { CertificateTemplate } from "@/types/certificate";
import { 
  AcademicCapIcon, 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EventCertificatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await certificatesService.listTemplatesByEvent(eventId);
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [eventId]);

  const handleIssueAll = async (templateId: string) => {
    setIsIssuing(templateId);
    setFeedback(null);
    try {
      const result = await certificatesService.issueBulkTemplate(templateId);
      setFeedback({ 
        type: 'success', 
        message: `Emissão concluída! ${result.processed} certificados gerados com sucesso.` 
      });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || "Erro ao iniciar emissão em massa." });
    } finally {
      setIsIssuing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Certificados</h1>
            <p className="text-muted-foreground font-medium">Configure e emita certificados para os participantes.</p>
          </div>
        </div>
        <Link 
          href={`/dashboard/events/${eventId}/certificates/new`}
          className="premium-button !px-6 !py-3 !text-sm !font-black inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Template
        </Link>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border animate-in slide-in-from-top-2 ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'
        } text-sm font-bold flex items-center gap-2`}>
          {feedback.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <div className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse border border-border" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="premium-card bg-card border-border overflow-hidden flex flex-col group">
              <div className="aspect-[4/3] relative overflow-hidden bg-muted border-b border-border">
                <img src={template.backgroundUrl} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button className="w-10 h-10 rounded-xl bg-white text-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <PencilIcon className="w-5 h-5" />
                   </button>
                   <button className="w-10 h-10 rounded-xl bg-white text-destructive flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                      <TrashIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{template.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {template.layoutConfig.placeholders.length} Variáveis configuradas
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleIssueAll(template.id)}
                    disabled={!!isIssuing}
                    className="premium-button !py-3 !text-[10px] !font-black flex items-center justify-center gap-2"
                  >
                    {isIssuing === template.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <EnvelopeIcon className="w-4 h-4" />
                    )}
                    EMITIR PARA TODOS
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground font-bold italic">Os participantes receberão por e-mail.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card p-16 bg-card border-border border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <AcademicCapIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Ainda não há templates</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Crie seu primeiro modelo de certificado enviando uma imagem de fundo e configurando os campos dinâmicos.
            </p>
          </div>
          <Link href={`/dashboard/events/${eventId}/certificates/new`} className="premium-button !px-8">
            Criar Modelo
          </Link>
        </div>
      )}
    </div>
  );
}
