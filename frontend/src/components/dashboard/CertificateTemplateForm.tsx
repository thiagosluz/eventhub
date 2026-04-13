"use client";

import { useState, useEffect } from "react";
import { certificatesService } from "@/services/certificates.service";
import { 
  PhotoIcon, 
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CertificateTemplate } from "@/types/certificate";
import { useRouter } from "next/navigation";

interface CertificateTemplateFormProps {
  eventId: string;
  initialData?: CertificateTemplate;
  isEditing?: boolean;
}

export default function CertificateTemplateForm({ 
  eventId, 
  initialData, 
  isEditing = false 
}: CertificateTemplateFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.backgroundUrl || null);
  const [category, setCategory] = useState<'PARTICIPANT' | 'SPEAKER' | 'REVIEWER' | 'MONITOR'>(initialData?.category || "PARTICIPANT");
  const [textBlocks, setTextBlocks] = useState(initialData?.layoutConfig.textBlocks || []);
  const [activeTextBlock, setActiveTextBlock] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Removido handlePlaceholderChange (Legado)

  const handleTextBlockChange = (index: number, field: string, value: any) => {
    const updated = [...textBlocks];
    (updated[index] as any)[field] = value;
    setTextBlocks(updated);
  };

  const addTextBlock = () => {
    let suggestedText = "Certificamos que {{participantName}} participou do evento {{eventName}}.";
    
    if (category === 'SPEAKER') {
      suggestedText = "Certificamos que {{speakerName}} atuou como palestrante na atividade {{activityTitle}} durante o evento {{eventName}}.";
    } else if (category === 'REVIEWER') {
      suggestedText = "Certificamos que {{reviewerName}} atuou como revisor(a) técnico(a) no evento {{eventName}}, avaliando {{submissionCount}} trabalhos nas áreas de {{area_tematica}}.";
    } else if (category === 'MONITOR') {
      suggestedText = "Certificamos que {{monitorName}} atuou como monitor(a) no evento {{eventName}} com carga horária de {{workload}}.";
    } else if (category === 'PARTICIPANT') {
      suggestedText = "Certificamos que {{participantName}} participou do evento {{eventName}} com carga horária de {{workload}}.";
    }

    setTextBlocks([...textBlocks, {
      text: suggestedText,
      x: 100,
      y: 250,
      width: 650,
      fontSize: 18,
      lineHeight: 1.4,
      color: "#000000",
      align: "center"
    }]);
  };

  const removeTextBlock = (index: number) => {
    setTextBlocks(textBlocks.filter((_, i) => i !== index));
  };

  // Removido removePlaceholder (Legado)

  const handlePreview = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    try {
      const blob = await certificatesService.previewTemplate({
        backgroundUrl: previewUrl,
        layoutConfig: { textBlocks }
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      setError("Erro ao gerar pré-visualização: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!backgroundFile && !previewUrl)) {
      setError("Nome e imagem de fundo são obrigatórios.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (isEditing && initialData) {
        // Update template
        await certificatesService.updateTemplate(initialData.id, {
          name,
          category,
          backgroundUrl: initialData.backgroundUrl, // URL will be updated if file is uploaded
          layoutConfig: { textBlocks }
        });

        // Upload new background if changed
        if (backgroundFile) {
          await certificatesService.uploadBackground(initialData.id, backgroundFile);
        }
      } else {
        // Create new template
        const template = await certificatesService.createTemplate(eventId, {
          name,
          category,
          backgroundUrl: "https://via.placeholder.com/800x600?text=Aguardando+Upload",
          layoutConfig: { textBlocks }
        });

        if (backgroundFile) {
          await certificatesService.uploadBackground(template.id, backgroundFile);
        }
      }

      router.push(`/dashboard/events/${eventId}/certificates`);
      router.refresh(); // Refresh page data
    } catch (err: any) {
      setError(err.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} template.`);
    } finally {
      setIsSaving(false);
    }
  };

  const getPlaceholdersForCategory = () => {
    const common = [
      { key: "eventName", label: "Nome do Evento" },
    ];
    
    switch (category) {
      case 'PARTICIPANT':
        return [
          ...common,
          { key: "participantName", label: "Nome do Participante" },
          { key: "workload", label: "Carga Horária Total" },
        ];
      case 'SPEAKER':
        return [
          ...common,
          { key: "speakerName", label: "Nome do Palestrante" },
          { key: "activityTitle", label: "Título da Atividade" },
          { key: "activityType", label: "Tipo (Ex: Oficina)" },
          { key: "speakerRole", label: "Papel (Ex: Coordenador)" },
        ];
      case 'MONITOR':
        return [
          ...common,
          { key: "monitorName", label: "Nome do Monitor" },
          { key: "workload", label: "Carga Horária (Staff)" },
        ];
      case 'REVIEWER':
        return [
          ...common,
          { key: "reviewerName", label: "Nome do Revisor" },
          { key: "area_tematica", label: "Área Acadêmica" },
          { key: "submissionCount", label: "Qtd. Trabalhos" },
        ];
      default:
        return common;
    }
  };

  const placeholdersList = getPlaceholdersForCategory();

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Editor Side */}
      <div className="lg:col-span-2 space-y-8">
        <div className="premium-card p-8 bg-card border-border space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome do Template</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Certificado de Participação - SECOMP"
              className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm shadow-sm"
               required
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categoria / Finalidade</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm shadow-sm"
              required
            >
              <option value="PARTICIPANT">Participante (Inscrição Geral)</option>
              <option value="SPEAKER">Palestrante (Atividade Específica)</option>
              <option value="MONITOR">Monitor / Staff (Evento)</option>
              <option value="REVIEWER">Revisor Acadêmico (Trabalhos)</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Imagem de Fundo (A4 Horizontal)</label>
            <div 
              id="certificate-preview-container"
              className="relative aspect-[1.414/1] rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden select-none"
              onMouseMove={(e) => {
                  // Removido arrasto de placeholders (Legado)
                if (activeTextBlock !== null) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 841.89;
                  const y = ((e.clientY - rect.top) / rect.height) * 595.28;
                  handleTextBlockChange(activeTextBlock, 'x', Math.round(x));
                  handleTextBlockChange(activeTextBlock, 'y', Math.round(y));
                }
              }}
              onMouseUp={() => {
                setActiveTextBlock(null);
              }}
            >
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                  {/* Removido render de placeholders sobre a imagem (Legado) */}

                  {textBlocks.map((b, index) => (
                    <div 
                      key={index}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveTextBlock(index);
                      }}
                      className={`absolute border-2 px-3 py-1.5 cursor-move transition-colors z-10 rounded-lg font-bold text-[10px] shadow-lg flex flex-col items-center gap-1 ${
                        activeTextBlock === index 
                          ? 'border-primary bg-primary text-white scale-105 ring-4 ring-primary/20' 
                          : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500'
                      }`}
                      style={{ 
                        left: `${(b.x / 841.89) * 100}%`, 
                        top: `${(b.y / 595.28) * 100}%`,
                        color: b.color,
                        width: b.width ? `${(b.width / 841.89) * 100}%` : 'auto',
                        borderColor: activeTextBlock === index ? 'var(--primary)' : `${b.color}80`
                      }}
                    >
                       <div className="line-clamp-2 text-center overflow-hidden w-full">
                         {b.text.replace(/\{\{(.*?)\}\}/g, '$1')}
                       </div>
                       <div className="flex items-center gap-2 text-[8px] opacity-70">
                         <span>X: {b.x} Y: {b.y}</span>
                         {b.width && <span>W: {b.width}</span>}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <PhotoIcon className="w-12 h-12 opacity-20 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Suba uma imagem para habilitar o editor visual</span>
                  <span className="text-[10px] opacity-50 mt-1">PNG ou JPG (3508x2480px recomendado)</span>
                </div>
              )}
              <input 
                type="file" 
                onChange={handleFileChange} 
                className={`absolute inset-0 opacity-0 cursor-pointer ${previewUrl ? 'hidden' : ''}`} 
              />
            </div>
            {previewUrl && (
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={addTextBlock}
                    className="text-emerald-500 hover:underline flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3" />
                    Adicionar Bloco de Texto
                  </button>
                  <button 
                    type="button"
                    onClick={handlePreview}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <PhotoIcon className="w-3 h-3" />
                    Visualizar PDF de Teste
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setBackgroundFile(null);
                  }}
                  className="text-destructive hover:underline"
                >
                  Trocar Fundo
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
              {error}
            </div>
          )}

          <div className="pt-6 border-t border-border flex justify-end gap-3">
             <button 
               type="button"
               onClick={() => router.back()}
               className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
             >
               Cancelar
             </button>
             <button 
              type="submit" 
              disabled={isSaving}
              className="premium-button !px-12 flex items-center gap-2"
            >
              {isSaving ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <>{isEditing ? 'Atualizar Template' : 'Criar Template'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Side */}
      <div className="space-y-8">
        <div className="premium-card p-6 bg-card border-border space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <InformationCircleIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold uppercase tracking-tight">Coordenadas</h2>
          </div>
          
          <div className="space-y-6">
            {/* Removido Configuração de Placeholders Legados */}

            {/* Nova Seção de Blocos de Texto */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block border-b border-border pb-2">Blocos de Texto Dinâmicos</label>
              
              {textBlocks.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic text-center py-4">Nenhum bloco de texto adicionado.</p>
              )}

              {textBlocks.map((b, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Bloco #{idx + 1}</span>
                     <button 
                       type="button"
                       onClick={() => removeTextBlock(idx)}
                       className="p-1 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                     >
                       <TrashIcon className="w-3.5 h-3.5" />
                     </button>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70 italic">Conteúdo (Use {"{{var}}"})</label>
                     <textarea 
                       value={b.text}
                       onChange={(e) => handleTextBlockChange(idx, 'text', e.target.value)}
                       className="w-full h-24 p-3 rounded-lg bg-card border border-border text-[11px] font-medium outline-none focus:border-emerald-500 resize-none leading-relaxed"
                     />
                     <div className="flex flex-wrap gap-1">
                        {placeholdersList.map(v => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => handleTextBlockChange(idx, 'text', b.text + ` {{${v.key}}}`)}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black hover:bg-emerald-500/20 transition-colors uppercase"
                          >
                            + {v.label}
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Largura Máx (Pts)</label>
                        <input 
                          type="number" 
                          value={b.width} 
                          onChange={(e) => handleTextBlockChange(idx, 'width', parseInt(e.target.value))}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-[10px] font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Alinhamento</label>
                        <select 
                          value={b.align}
                          onChange={(e) => handleTextBlockChange(idx, 'align', e.target.value)}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-[10px] font-bold outline-none focus:border-emerald-500"
                        >
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                          <option value="justify">Justificado</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Tamanho Fonte</label>
                        <input 
                          type="number" 
                          value={b.fontSize} 
                          onChange={(e) => handleTextBlockChange(idx, 'fontSize', parseInt(e.target.value))}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-[10px] font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Cor</label>
                        <input 
                          type="color" 
                          value={b.color} 
                          onChange={(e) => handleTextBlockChange(idx, 'color', e.target.value)}
                          className="w-full h-8 px-1 py-1 rounded-lg bg-card border border-border cursor-pointer outline-none focus:border-emerald-500"
                        />
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
             <p className="text-[10px] text-muted-foreground leading-relaxed">
               <strong className="text-primary uppercase block mb-1">Dica técnica:</strong>
               As coordenadas seguem o padrão PDFKit (pontos). 
               A4 Horizontal tem largura de aproximadamente 842 e altura 595.
             </p>
          </div>
        </div>
      </div>
    </form>
  );
}
