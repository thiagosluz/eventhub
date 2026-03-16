"use client";

import { useEffect, useState, use } from "react";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";
import { 
  PhotoIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  GlobeAltIcon,
  CalendarIcon,
  MapPinIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  QrCodeIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    seoTitle: "",
    seoDescription: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    primaryColor: "#6366f1"
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getOrganizerEventById(id);
        setEvent(data);
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || "",
          location: data.location || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
          seoTitle: (data as any).seoTitle || "",
          seoDescription: (data as any).seoDescription || "",
          status: data.status,
          primaryColor: data.themeConfig?.primaryColor || "#6366f1"
        });
      } catch (err) {
        setError("Não foi possível carregar os dados do evento.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      const updateData = {
        ...formData,
        themeConfig: {
          ...event?.themeConfig,
          primaryColor: formData.primaryColor
        }
      };
      await eventsService.updateEvent(id, updateData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      if (type === 'banner') {
        const updated = await eventsService.uploadBanner(id, file);
        setEvent(updated);
      } else {
        const updated = await eventsService.uploadLogo(id, file);
        setEvent(updated);
      }
    } catch (err) {
      setError(`Erro ao fazer upload do ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando gerenciador...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
            {event?.logoUrl ? (
              <img src={event.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <GlobeAltIcon className="w-8 h-8 text-primary opacity-40" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground">{event?.name}</h1>
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm ${
                event?.status === 'PUBLISHED' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
              }`}>
                {event?.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <p className="text-muted-foreground font-medium">Painel de Gerenciamento e Controle de Conteúdo.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/events/${event?.slug}`} target="_blank" className="px-6 py-3 rounded-xl border-2 border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">
            Ver página pública
          </Link>
          <Link href="/dashboard/events" className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2 px-2">
            <ChevronLeftIcon className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card p-8 bg-card border-border">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
              <InformationCircleIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Dados Gerais</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {saveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in">
                  <CheckCircleIcon className="w-5 h-5" />
                  Alterações salvas com sucesso!
                </div>
              )}
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nome do Evento</label>
                  <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Slug da URL</label>
                  <input name="slug" value={formData.slug} onChange={handleChange} type="text" className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full p-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Localização</label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input name="location" value={formData.location} onChange={handleChange} type="text" className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm">
                    <option value="DRAFT">Rascunho</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="ARCHIVED">Arquivado</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2 bg-muted/20 p-6 rounded-2xl border border-dashed border-border">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Cor Primária do Evento</label>
                  <div className="flex items-center gap-4">
                    <input 
                      name="primaryColor" 
                      value={formData.primaryColor} 
                      onChange={handleChange} 
                      type="color" 
                      className="w-16 h-12 p-1 rounded-xl border border-border bg-card cursor-pointer" 
                    />
                    <input 
                      name="primaryColor" 
                      value={formData.primaryColor} 
                      onChange={handleChange} 
                      type="text" 
                      className="flex-1 h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-mono font-bold text-sm uppercase" 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold px-1 italic">Essa cor será a base da identidade visual nas páginas públicas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data Início</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input name="startDate" value={formData.startDate} onChange={handleChange} type="datetime-local" className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data Término</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input name="endDate" value={formData.endDate} onChange={handleChange} type="datetime-local" className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="premium-button !px-12 flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Salvar Alterações</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar: Media & SEO */}
        <div className="space-y-8">
          {/* Media Sections */}
          <div className="premium-card p-6 bg-card border-border space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <PhotoIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Capas e Logo</h2>
            </div>
            
            <div className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Banner Principal</p>
                <div className="relative aspect-video rounded-xl bg-muted border-2 border-dashed border-border overflow-hidden group cursor-pointer">
                  {event?.bannerUrl ? (
                    <img src={event.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <PhotoIcon className="w-8 h-8 opacity-20" />
                      <span className="text-[10px] font-bold uppercase mt-2">Clique para enviar</span>
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleFileUpload(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ArrowUpTrayIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logo do Evento</p>
                <div className="relative w-32 h-32 rounded-xl bg-muted border-2 border-dashed border-border overflow-hidden group">
                  {event?.logoUrl ? (
                    <img src={event.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <GlobeAltIcon className="w-6 h-6 opacity-20" />
                    </div>
                  )}
                  <input type="file" onChange={(e) => handleFileUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 bg-emerald-500/5 border-emerald-500/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-tight text-emerald-600">Certificados</h3>
            <p className="text-xs text-muted-foreground font-medium">Configure os certificados que serão emitidos para os participantes deste evento.</p>
            <Link 
              href={`/dashboard/events/${id}/certificates`} 
              className="premium-button !py-2.5 !text-[10px] !font-black flex items-center justify-center gap-2"
            >
              <AcademicCapIcon className="w-4 h-4" />
              GERENCIAR CERTIFICADOS
            </Link>
          </div>

          <div className="premium-card p-6 bg-indigo-500/5 border-indigo-500/10 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-indigo-600">Programação (Grade)</h3>
            <p className="text-xs text-muted-foreground font-medium">Crie palestras, oficinas e painéis para o seu evento.</p>
            <Link 
              href={`/dashboard/events/${id}/activities`} 
              className="premium-button !bg-indigo-600 hover:!bg-indigo-700 !shadow-indigo-200 !py-2.5 !text-[10px] !font-black flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              MONTAR GRADE / HORÁRIOS
            </Link>
          </div>

          <div className="premium-card p-6 bg-amber-500/5 border-amber-500/10 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-amber-600">Formulário de Inscrição</h3>
            <p className="text-xs text-muted-foreground font-medium">Personalize as perguntas que os participantes devem responder.</p>
            <Link 
              href={`/dashboard/events/${id}/forms`} 
              className="premium-button !bg-amber-600 hover:!bg-amber-700 !shadow-amber-200 !py-2.5 !text-[10px] !font-black flex items-center justify-center gap-2"
            >
              <InformationCircleIcon className="w-4 h-4" />
              GERENCIAR PERGUNTAS
            </Link>
          </div>

          <div className="premium-card p-6 bg-primary/5 border-primary/10 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-primary">Operações ao Vivo</h3>
              <p className="text-[10px] text-muted-foreground font-bold">Ferramentas para o dia do evento.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Link 
                href={`/dashboard/events/${id}/operations/checkin`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <QrCodeIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">Scanner Check-in</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Validar Ingressos</p>
                </div>
              </Link>

              <Link 
                href={`/dashboard/events/${id}/operations/raffle`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">Sorteador</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Ganhadores ao Vivo</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
