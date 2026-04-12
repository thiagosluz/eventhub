"use client";

import { useEffect, useState, use } from "react";
import { certificatesService } from "@/services/certificates.service";
import { CertificateTemplate } from "@/types/certificate";
import CertificateTemplateForm from "@/components/dashboard/CertificateTemplateForm";
import { ArrowPathIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EditCertificateTemplatePage({ 
  params 
}: { 
  params: Promise<{ id: string, templateId: string }> 
}) {
  const { id: eventId, templateId } = use(params);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const data = await certificatesService.getTemplate(templateId);
        setTemplate(data);
      } catch (error) {
        console.error("Failed to fetch template", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ArrowPathIcon className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Carregando Template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-black">Template não encontrado</h2>
        <Link href={`/dashboard/events/${eventId}/certificates`} className="premium-button">
          Voltar para Lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}/certificates`} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Editar Template</h1>
          <p className="text-muted-foreground font-medium">Ajuste o layout e as variáveis do certificado.</p>
        </div>
      </div>
      <CertificateTemplateForm eventId={eventId} initialData={template} isEditing />
    </div>
  );
}
