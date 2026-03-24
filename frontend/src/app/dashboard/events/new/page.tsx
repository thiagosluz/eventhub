"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/services/events.service";
import { SeoPreview } from "@/components/dashboard/SeoPreview";
import { 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  InformationCircleIcon, 
  CalendarIcon, 
  MapPinIcon,
  SparklesIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
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
    status: "DRAFT" as "DRAFT" | "PUBLISHED"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-generate slug from name if step 1
      if (name === "name" && step === 1) {
        newData.slug = value.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ /g, "-")
          .replace(/[^\w-]/g, "");
      }
      return newData;
    });
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }
    setIsLoading(true);
    setError("");

    const { startDate, endDate } = formData;
    if (!startDate || !endDate) {
      setError("As datas de início e término são obrigatórias.");
      setIsLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("As datas fornecidas são inválidas.");
      setIsLoading(false);
      return;
    }

    if (start >= end) {
      setError("A data de término deve ser posterior à data de início.");
      setIsLoading(false);
      return;
    }

    try {
      const createdEvent = await eventsService.createEvent(formData);
      router.push(`/dashboard/events/${createdEvent.id}?success=true`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar evento. Verifique os dados e tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "Informações Básicas", icon: InformationCircleIcon },
    { id: 2, name: "Data e Local", icon: MapPinIcon },
    { id: 3, name: "SEO e Detalhes", icon: SparklesIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Criar Novo Evento</h1>
          <p className="text-muted-foreground font-medium">Preencha os dados abaixo para começar sua jornada.</p>
        </div>
        <Link href="/dashboard/events" className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2">
          <ChevronLeftIcon className="w-4 h-4" />
          Voltar para Lista
        </Link>
      </div>

      {/* Stepper */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2" />
        <div className="relative flex justify-between">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 relative z-10 ${
                step >= s.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground"
              }`}>
                {step > s.id ? <CheckIcon className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step >= s.id ? "text-primary" : "text-muted-foreground"
              }`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-8 bg-card border-border min-h-[500px] flex flex-col">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nome do Evento *</label>
                  <input 
                    required 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text" 
                    placeholder="Ex: Semana de Tecnologia 2024" 
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Slug (URL) *</label>
                  <input 
                    required 
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    type="text" 
                    placeholder="semana-tecnologia-2024" 
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Descrição</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Descreva seu evento com detalhes..." 
                  className="w-full p-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Localização</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    type="text" 
                    placeholder="Ex: Auditório Principal ou Link do Zoom" 
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data de Início *</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      required
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      type="datetime-local" 
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data de Término *</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      required
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      type="datetime-local" 
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Status Inicial</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm cursor-pointer"
                >
                  <option value="DRAFT">Rascunho (Privado)</option>
                  <option value="PUBLISHED">Publicado (Visível para todos)</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Título SEO</label>
                  <span className={`text-[10px] font-black tracking-widest ${formData.seoTitle.length > 60 ? 'text-destructive' : formData.seoTitle.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{formData.seoTitle.length}/60</span>
                </div>
                <input 
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleChange}
                  type="text" 
                  placeholder="Título para o Google e Redes Sociais" 
                  className={`w-full h-12 px-4 rounded-xl border ${formData.seoTitle.length > 60 ? 'border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'} bg-card focus:ring-4 transition-all outline-none font-bold text-sm`} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Descrição SEO</label>
                  <span className={`text-[10px] font-black tracking-widest ${formData.seoDescription.length > 160 ? 'text-destructive' : formData.seoDescription.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{formData.seoDescription.length}/160</span>
                </div>
                <textarea 
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Breve resumo para buscadores..." 
                  className={`w-full p-4 rounded-xl border ${formData.seoDescription.length > 160 ? 'border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'} bg-card focus:ring-4 transition-all outline-none font-bold text-sm`} 
                />
              </div>

              <SeoPreview 
                seoTitle={formData.seoTitle}
                seoDescription={formData.seoDescription}
                name={formData.name}
                slug={formData.slug}
                description={formData.description}
              />
            </div>
          )}

          <div className="mt-auto pt-8 flex items-center justify-between border-t border-border mt-12">
            <div>
              {step > 1 && (
                <button 
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 rounded-xl border-2 border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all flex items-center gap-2"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Anterior
                </button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <button 
                  type="button"
                  onClick={nextStep}
                  className="premium-button !px-8 !py-3 !text-xs !font-black flex items-center gap-2"
                >
                  Próximo Passo
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="premium-button !px-12 !py-3 !text-xs !font-black flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Criar Evento
                      <CheckIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
