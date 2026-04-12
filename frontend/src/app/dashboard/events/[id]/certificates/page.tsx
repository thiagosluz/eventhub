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
  CheckCircleIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  XMarkIcon,
  PlusCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";

export default function EventCertificatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState<string | null>(null);
  const [isDuplicateLoading, setIsDuplicateLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [selectedTemplateForIssue, setSelectedTemplateForIssue] = useState<string | null>(null);
  
  const [templateToDelete, setTemplateToDelete] = useState<CertificateTemplate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [requiresSafetyWord, setRequiresSafetyWord] = useState(false);

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

  useEffect(() => {
    fetchTemplates();
  }, [eventId]);

  const handleIssueAll = async (templateId: string, strategy: "skip" | "overwrite") => {
    setIsIssuing(templateId);
    setFeedback(null);
    setIsStrategyModalOpen(false);
    try {
      const result = await certificatesService.issueBulkTemplate(templateId, true, strategy);
      if (result.failed > 0) {
        setFeedback({ 
          type: 'error', 
          message: `Emissão parcial: ${result.processed} gerados, ${result.failed} falharam. Verifique os logs.` 
        });
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Emissão concluída! ${result.processed} certificados gerados/atualizados com sucesso.` 
        });
      }
      fetchTemplates(); // Refresh counts
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || "Erro ao iniciar emissão em massa." });
    } finally {
      setIsIssuing(null);
      setSelectedTemplateForIssue(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsDuplicateLoading(id);
    setFeedback(null);
    try {
      const newTemplate = await certificatesService.duplicateTemplate(id);
      setTemplates([newTemplate, ...templates]);
      setFeedback({ type: 'success', message: 'Template duplicado com sucesso!' });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || "Erro ao duplicar template." });
    } finally {
      setIsDuplicateLoading(null);
    }
  };

  const handleDelete = async (safetyWord?: string) => {
    if (!templateToDelete) return;

    // Se o modal requer a palavra mas ela não foi enviada ou está errada (fallback frontend)
    if (requiresSafetyWord && safetyWord?.trim() !== "DELETAR") return;

    setIsDeleting(true);
    setFeedback(null);
    let shouldClear = true;

    try {
      await certificatesService.deleteTemplate(
        templateToDelete.id, 
        requiresSafetyWord, 
        safetyWord?.trim()
      );
      
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setFeedback({ type: 'success', message: 'Template excluído com sucesso!' });
      setIsDeleteModalOpen(false);
      setRequiresSafetyWord(false);
    } catch (error: any) {
      if (error.status === 409) {
        setRequiresSafetyWord(true);
        setFeedback({ 
          type: 'error', 
          message: "Este template possui certificados emitidos. Digite DELETAR para confirmar a exclusão de tudo." 
        });
        shouldClear = false;
      } else {
        setFeedback({ 
          type: 'error', 
          message: error.message || "Não foi possível excluir o template." 
        });
        setIsDeleteModalOpen(false);
      }
    } finally {
      setIsDeleting(false);
      if (shouldClear) setTemplateToDelete(null);
    }
  };

  const handlePreview = async (template: CertificateTemplate) => {
    try {
      const blob = await certificatesService.previewTemplate({
        backgroundUrl: template.backgroundUrl,
        layoutConfig: template.layoutConfig
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Erro ao gerar preview do PDF.' });
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
                <Image 
                  src={template.backgroundUrl} 
                  alt={template.name} 
                  fill
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Link 
                     href={`/dashboard/events/${eventId}/certificates/${template.id}/edit`}
                     title="Editar Template"
                     className="w-10 h-10 rounded-xl bg-white text-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                   >
                      <PencilIcon className="w-5 h-5" />
                   </Link>
                   <button 
                     onClick={() => handleDuplicate(template.id)}
                     disabled={isDuplicateLoading === template.id}
                     title="Duplicar Template"
                     className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center hover:scale-110 transition-transform shadow-xl disabled:opacity-50"
                   >
                      {isDuplicateLoading === template.id ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                   </button>
                   <button 
                     onClick={() => handlePreview(template)}
                     title="Visualizar PDF"
                     className="w-10 h-10 rounded-xl bg-white text-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                   >
                      <EyeIcon className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => {
                        setTemplateToDelete(template);
                        setIsDeleteModalOpen(true);
                     }}
                     title="Excluir Template"
                     className="w-10 h-10 rounded-xl bg-white text-destructive flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                   >
                      <TrashIcon className="w-5 h-5" />
                   </button>
                </div>
                
                {/* Badge de Contagem */}
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-[10px] font-black text-white uppercase tracking-tighter">
                  {template._count?.issuedCertificates || 0} Emitidos
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground line-clamp-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {template.layoutConfig.placeholders.length} Variáveis configuradas
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTemplateForIssue(template.id);
                      setIsStrategyModalOpen(true);
                    }}
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

      {/* Modal de Confirmação */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRequiresSafetyWord(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDelete}
        title={requiresSafetyWord ? "Exclusão Irreversível" : "Excluir Template"}
        description={requiresSafetyWord 
          ? `ALERTA: Existem ${templateToDelete?._count?.issuedCertificates ?? 0} certificados emitidos para este template. A exclusão irá APAGAR todos os registros desses participantes permanentemente.` 
          : `Tem certeza que deseja excluir o template "${templateToDelete?.name}"? Esta ação não pode ser desfeita.`
        }
        isLoading={isDeleting}
        requiresSafetyWord={requiresSafetyWord}
        safetyWord="DELETAR"
      />

      {/* Modal de Estratégia de Emissão */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-foreground">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight text-foreground">Estratégia de Emissão</h3>
                  <p className="text-muted-foreground text-sm font-medium">Como você deseja realizar o processamento em massa?</p>
                </div>
                <button 
                  onClick={() => setIsStrategyModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => selectedTemplateForIssue && handleIssueAll(selectedTemplateForIssue, 'skip')}
                  className="group p-6 rounded-2xl border border-border bg-muted/30 hover:bg-card hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <PlusCircleIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-lg mb-1 text-foreground">Apenas Novos</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed font-semibold">
                    Emite certificados somente para participantes que ainda não receberam. **Ideal para novos check-ins.**
                  </p>
                </button>

                <button
                  onClick={() => selectedTemplateForIssue && handleIssueAll(selectedTemplateForIssue, 'overwrite')}
                  className="group p-6 rounded-2xl border border-border bg-muted/30 hover:bg-card hover:border-destructive/50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 group-hover:scale-110 transition-transform">
                    <ArrowPathIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-lg mb-1 text-destructive">Sobrescrever Todos</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed font-semibold">
                    Gera novos arquivos para todos, atualizando os existentes. **Use se você corrigiu o layout.**
                  </p>
                </button>
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border flex justify-end">
              <button
                onClick={() => setIsStrategyModalOpen(false)}
                className="px-6 py-2 rounded-xl border border-border bg-card font-bold text-sm hover:bg-muted transition-colors text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
