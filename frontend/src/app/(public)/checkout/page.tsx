"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventsService } from "@/services/events.service";
import { checkoutService, FormResponseInput } from "@/services/checkout.service";
import { Event, FormField } from "@/types/event";
import { 
  CheckCircleIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  TicketIcon,
  UserIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const eventId = searchParams.get("eventId");
  const slug = searchParams.get("slug");
  const activityIdsStr = searchParams.get("activityIds");
  const activityIds = activityIdsStr ? activityIdsStr.split(",") : [];

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/checkout?${searchParams.toString()}`);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  useEffect(() => {
    if (slug) {
      eventsService.getPublicEventBySlug(slug)
        .then(setEvent)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Preparando checkout...</p>
      </div>
    );
  }

  if (!event || !eventId) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-20">
        <h2 className="text-2xl font-black text-foreground">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground">Não conseguimos localizar as informações do evento para o checkout.</p>
        <Link href="/events" className="premium-button inline-block">Voltar para Eventos</Link>
      </div>
    );
  }

  const registrationForm = event.forms?.find(f => f.type === 'REGISTRATION');
  const fields = registrationForm?.fields || [];

  const handleInputChange = (fieldId: string, value: string) => {
    setFormAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const formResponses: FormResponseInput[] = registrationForm ? [{
        formId: registrationForm.id,
        answers: Object.entries(formAnswers).map(([fieldId, value]) => ({ fieldId, value }))
      }] : [];

      await checkoutService.processCheckout({
        eventId,
        activityIds,
        formResponses
      });

      router.push("/checkout/success");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao processar sua inscrição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: "Identificação", icon: UserIcon },
    { id: 2, name: "Informações Adicionais", icon: ClipboardDocumentCheckIcon },
    { id: 3, name: "Confirmação", icon: TicketIcon },
  ];

  return (
    <ThemeProvider themeConfig={event.themeConfig} tenantThemeConfig={(event as any).tenant?.themeConfig}>
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* Stepper */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2" />
        <div className="relative flex justify-between">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 relative z-10 ${
                step >= s.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground"
              }`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${
                step >= s.id ? "text-primary" : "text-muted-foreground"
              }`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <div className="lg:col-span-2">
          <div className="premium-card p-8 bg-card border-border space-y-8 min-h-[400px]">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-foreground">Confirme seus Dados</h2>
                  <p className="text-sm text-muted-foreground font-medium">Estes dados serão utilizados para o seu certificado e ingresso.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Nome Completo</label>
                    <input type="text" disabled value={user?.name} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/50 text-muted-foreground font-bold outline-none cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">E-mail</label>
                    <input type="text" disabled value={user?.email} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/50 text-muted-foreground font-bold outline-none cursor-not-allowed" />
                  </div>
                </div>

                <div className="pt-8">
                  <button onClick={nextStep} className="premium-button w-full !py-4 flex items-center justify-center gap-2">
                    Prosseguir
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-foreground">Formulário Adicional</h2>
                  <p className="text-sm text-muted-foreground font-medium">O organizador solicita algumas informações extras para sua participação.</p>
                </div>

                <div className="space-y-6">
                  {fields.length > 0 ? fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                        {field.label} {field.required && <span className="text-primary">*</span>}
                      </label>
                      <input 
                        type={field.type === 'email' ? 'email' : 'text'}
                        value={formAnswers[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm"
                        placeholder={`Digite seu ${field.label.toLowerCase()}`}
                      />
                    </div>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground font-medium italic">
                      Este evento não requer informações adicionais.
                    </div>
                  )}
                </div>

                <div className="pt-8 flex gap-4">
                  <button onClick={prevStep} className="px-6 h-14 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">Voltar</button>
                  <button onClick={nextStep} className="premium-button flex-1 !py-4 flex items-center justify-center gap-2 text-lg">
                    Revisar Pedido
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground">Tudo Pronto?</h2>
                  <p className="text-sm text-muted-foreground font-medium text-center">Revise as informações abaixo antes de finalizar sua inscrição gratuita.</p>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Inscrito</span>
                    <span className="font-black text-foreground uppercase">{user?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Ingresso</span>
                    <span className="font-black text-primary uppercase">Ingresso Geral</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Atividades</span>
                    <span className="font-black text-foreground">{activityIds.length} selecionadas</span>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button onClick={prevStep} className="px-6 h-14 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">Voltar</button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="premium-button flex-1 !py-4 flex items-center justify-center gap-2 text-xl"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Finalizar Inscrição
                        <CheckCircleIcon className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="premium-card p-6 bg-primary/5 border-primary/20 sticky top-32 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-4">Resumo do Pedido</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                  {event.bannerUrl ? (
                    <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-500/10 text-primary flex items-center justify-center">
                      <TicketIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-foreground leading-tight line-clamp-2">{event.name}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-primary/10">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Ingresso Geral</span>
                  <span>R$ 0,00</span>
                </div>
                {activityIds.length > 0 && (
                  <div className="flex justify-between text-xs font-medium text-muted-foreground italic">
                    <span>+ {activityIds.length} Atividades extras</span>
                    <span>R$ 0,00</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black pt-4 text-primary border-t border-primary/10">
                  <span>Total</span>
                  <span>R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ThemeProvider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold">Carregando Checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
