"use client";

import { useState, use } from "react";
import { certificatesService } from "@/services/certificates.service";
import { 
  PhotoIcon, 
  ChevronLeftIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewCertificateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();

  const [name, setName] = useState("");
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState([
    { key: "participantName", label: "Nome do Participante", x: 100, y: 150, fontSize: 24, color: "#000000" },
    { key: "eventName", label: "Nome do Evento", x: 100, y: 300, fontSize: 14, color: "#000000" },
    { key: "workload", label: "Carga Horária", x: 100, y: 400, fontSize: 12, color: "#000000" },
  ]);
  const [activePlaceholder, setActivePlaceholder] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePlaceholderChange = (index: number, field: string, value: any) => {
    const updated = [...placeholders];
    (updated[index] as any)[field] = value;
    setPlaceholders(updated);
  };

  const handlePreview = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    try {
      const blob = await certificatesService.previewTemplate({
        backgroundUrl: previewUrl,
        layoutConfig: { placeholders }
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
      // 1. Create template with temporary background
      const template = await certificatesService.createTemplate(eventId, {
        name,
        backgroundUrl: "https://via.placeholder.com/800x600?text=Aguardando+Upload",
        layoutConfig: { placeholders }
      });

      // 2. Upload actual background
      if (backgroundFile) {
        await certificatesService.uploadBackground(template.id, backgroundFile);
      }

      router.push(`/dashboard/events/${eventId}/certificates`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}/certificates`} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Novo Template</h1>
            <p className="text-muted-foreground font-medium">Desenhe o layout do seu certificado.</p>
          </div>
        </div>
      </div>

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
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Imagem de Fundo (A4 Horizontal)</label>
              <div 
                id="certificate-preview-container"
                className="relative aspect-[1.414/1] rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden select-none"
                onMouseMove={(e) => {
                  if (activePlaceholder !== null) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 841.89;
                    const y = ((e.clientY - rect.top) / rect.height) * 595.28;
                    handlePlaceholderChange(activePlaceholder, 'x', Math.round(x));
                    handlePlaceholderChange(activePlaceholder, 'y', Math.round(y));
                  }
                }}
                onMouseUp={() => setActivePlaceholder(null)}
                onMouseLeave={() => setActivePlaceholder(null)}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                    {/* Visual Overlay of Placeholders */}
                    {placeholders.map((p, index) => (
                      <div 
                        key={p.key}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setActivePlaceholder(index);
                        }}
                        className={`absolute border-2 px-3 py-1.5 whitespace-nowrap cursor-move transition-colors z-10 rounded-lg font-bold text-[10px] shadow-lg ${
                          activePlaceholder === index 
                            ? 'border-primary bg-primary text-white scale-105 ring-4 ring-primary/20' 
                            : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                        }`}
                        style={{ 
                          left: `${(p.x / 841.89) * 100}%`, 
                          top: `${(p.y / 595.28) * 100}%`,
                          color: p.color,
                          borderColor: activePlaceholder === index ? 'var(--primary)' : `${p.color}80`
                        }}
                      >
                         <div className="flex flex-col items-center">
                           <span>{p.label}</span>
                           <span className="text-[8px] opacity-70">X: {p.x} Y: {p.y}</span>
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
                    <span>Dica: Arraste os campos sobre o certificado</span>
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
                    onClick={() => setPreviewUrl(null)}
                    className="text-destructive hover:underline"
                  >
                    Trocar Fundo
                  </button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3">
               <Link 
                 href={`/dashboard/events/${eventId}/certificates`}
                 className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
               >
                 Cancelar
               </Link>
               <button 
                type="submit" 
                disabled={isSaving}
                className="premium-button !px-12 flex items-center gap-2"
              >
                {isSaving ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>Criar Template</>
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
              {placeholders.map((p, idx) => (
                <div key={p.key} className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary">{p.label}</span>
                     <span className="text-[10px] font-mono text-muted-foreground">#{p.key}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Pos X</label>
                        <input 
                          type="number" 
                          value={p.x} 
                          onChange={(e) => handlePlaceholderChange(idx, 'x', parseInt(e.target.value))}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-xs font-bold outline-none focus:border-primary"
                        />
                      </div>
                       <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Pos Y</label>
                        <input 
                          type="number" 
                          value={p.y} 
                          onChange={(e) => handlePlaceholderChange(idx, 'y', parseInt(e.target.value))}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-xs font-bold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Tamanho</label>
                        <input 
                          type="number" 
                          value={p.fontSize} 
                          onChange={(e) => handlePlaceholderChange(idx, 'fontSize', parseInt(e.target.value))}
                          className="w-full h-8 px-2 rounded-lg bg-card border border-border text-xs font-bold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Cor</label>
                        <input 
                          type="color" 
                          value={p.color} 
                          onChange={(e) => handlePlaceholderChange(idx, 'color', e.target.value)}
                          className="w-full h-8 px-1 py-1 rounded-lg bg-card border border-border cursor-pointer outline-none focus:border-primary"
                        />
                      </div>
                   </div>
                </div>
              ))}
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
    </div>
  );
}
