"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  TicketIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/context/AuthContext";
import { eventsService } from "@/services/events.service";
import {
  checkoutService,
  type FormResponseInput,
} from "@/services/checkout.service";
import type { Event, FormField } from "@/types/event";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { buildDynamicFormSchema } from "@/lib/validation/checkout";

type DynamicAnswers = Record<string, string>;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const eventId = searchParams.get("eventId");
  const slug = searchParams.get("slug");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(
        `/auth/login?redirect=/checkout?${searchParams.toString()}`,
      );
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  useEffect(() => {
    if (slug) {
      eventsService
        .getPublicEventBySlug(slug)
        .then(setEvent)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const registrationForm = event?.forms?.find(
    (f) => f.type === "REGISTRATION",
  );
  const fields: FormField[] = useMemo(
    () => registrationForm?.fields || [],
    [registrationForm],
  );

  const schema = useMemo(() => buildDynamicFormSchema(fields), [fields]);
  const defaultValues = useMemo<DynamicAnswers>(() => {
    const init: DynamicAnswers = {};
    for (const f of fields) init[f.id] = "";
    return init;
  }, [fields]);

  const {
    control,
    trigger,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DynamicAnswers>({
    resolver: zodResolver(schema) as Resolver<DynamicAnswers>,
    defaultValues,
    shouldUnregister: false,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">
          Preparando checkout...
        </p>
      </div>
    );
  }

  if (!event || !eventId) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-20">
        <h2 className="text-2xl font-black text-foreground">
          Ops! Algo deu errado.
        </h2>
        <p className="text-muted-foreground">
          Não conseguimos localizar as informações do evento para o checkout.
        </p>
        <Link href="/events" className="premium-button inline-block">
          Voltar para Eventos
        </Link>
      </div>
    );
  }

  const nextStep = async () => {
    if (step === 2) {
      const ok = await trigger();
      if (!ok) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
    }
    setError("");
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (values: DynamicAnswers) => {
    setIsSubmitting(true);
    setError("");

    try {
      const formResponses: FormResponseInput[] = registrationForm
        ? [
            {
              formId: registrationForm.id,
              answers: Object.entries(values).map(([fieldId, value]) => ({
                fieldId,
                value,
              })),
            },
          ]
        : [];

      await checkoutService.processCheckout({
        eventId,
        activityIds: [],
        formResponses,
      });

      router.push("/checkout/success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao processar sua inscrição. Tente novamente.";
      console.error(err);
      setError(message);
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
    <ThemeProvider
      themeConfig={event.themeConfig}
      tenantThemeConfig={event.tenant?.themeConfig}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="max-w-4xl mx-auto px-6 py-12 space-y-12"
      >
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2" />
          <div className="relative flex justify-between">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 relative z-10 ${
                    step >= s.id
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  <s.icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-widest ${
                    step >= s.id ? "text-primary" : "text-muted-foreground"
                  }`}
                >
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
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold animate-in fade-in zoom-in duration-300"
                >
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-foreground">
                      Confirme seus Dados
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">
                      Estes dados serão utilizados para o seu certificado e
                      ingresso.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Nome Completo"
                      value={user?.name || ""}
                      disabled
                      readOnly
                    />
                    <Input
                      label="E-mail"
                      value={user?.email || ""}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="pt-8">
                    <Button
                      type="button"
                      fullWidth
                      size="lg"
                      onClick={nextStep}
                      rightIcon={<ChevronRightIcon className="w-5 h-5" />}
                    >
                      Prosseguir
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-foreground">
                      Formulário Adicional
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">
                      O organizador solicita algumas informações extras para
                      sua participação.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {fields.length > 0 ? (
                      fields.map((field) => (
                        <DynamicFieldControl
                          key={field.id}
                          field={field}
                          control={control}
                          errorMessage={
                            (errors[field.id]?.message as string) || undefined
                          }
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground font-medium italic">
                        Este evento não requer informações adicionais.
                      </div>
                    )}
                  </div>

                  <div className="pt-8 flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      className="flex-1"
                      onClick={nextStep}
                      rightIcon={<ChevronRightIcon className="w-5 h-5" />}
                    >
                      Revisar Pedido
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">
                      Tudo Pronto?
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium text-center">
                      Revise as informações abaixo antes de finalizar sua
                      inscrição gratuita.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">
                        Inscrito
                      </span>
                      <span className="font-black text-foreground uppercase">
                        {user?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">
                        Ingresso
                      </span>
                      <span className="font-black text-primary uppercase">
                        Ingresso Geral
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">
                        Acesso
                      </span>
                      <span className="font-black text-foreground">
                        Todas as atividades abertas
                      </span>
                    </div>
                  </div>

                  <div className="pt-8 flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1"
                      isLoading={isSubmitting}
                      rightIcon={<CheckCircleIcon className="w-6 h-6" />}
                    >
                      Finalizar Inscrição
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="premium-card p-6 bg-primary/5 border-primary/20 sticky top-32 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-4">
                Resumo do Pedido
              </h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden shrink-0 border border-border relative">
                    {event.bannerUrl ? (
                      <Image
                        src={event.bannerUrl}
                        alt={event.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-500/10 text-primary flex items-center justify-center">
                        <TicketIcon className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-foreground leading-tight line-clamp-2">
                      {event.name}
                    </p>
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
                  <div className="flex justify-between text-xs font-medium text-muted-foreground italic">
                    <span>Palestras e Workshops Abertos</span>
                    <span>Incluso</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-4 text-primary border-t border-primary/10">
                    <span>Total</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </ThemeProvider>
  );
}

interface DynamicFieldControlProps {
  field: FormField;
  control: ReturnType<typeof useForm<DynamicAnswers>>["control"];
  errorMessage?: string;
}

function DynamicFieldControl({
  field,
  control,
  errorMessage,
}: DynamicFieldControlProps) {
  return (
    <Controller
      control={control}
      name={field.id}
      render={({ field: rhf }) => {
        switch (field.type) {
          case "TEXTAREA":
            return (
              <Textarea
                label={field.label}
                placeholder={`Digite seu ${field.label.toLowerCase()}`}
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
              />
            );
          case "SELECT":
            return (
              <Select
                label={field.label}
                placeholder="Selecione uma opção"
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
              >
                {Array.isArray(field.options) &&
                  field.options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
              </Select>
            );
          case "MULTISELECT": {
            const currentSelected = rhf.value
              ? String(rhf.value)
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : [];
            return (
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-foreground">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1" aria-hidden>
                      *
                    </span>
                  )}
                </legend>
                <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                  {Array.isArray(field.options) &&
                    field.options.map((opt, idx) => {
                      const checked = currentSelected.includes(opt);
                      return (
                        <label
                          key={idx}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30"
                            checked={checked}
                            onChange={(e) => {
                              let next = [...currentSelected];
                              if (e.target.checked && !checked) next.push(opt);
                              else if (!e.target.checked && checked)
                                next = next.filter((v) => v !== opt);
                              rhf.onChange(next.join(", "));
                            }}
                            onBlur={rhf.onBlur}
                            name={rhf.name}
                          />
                          <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                </div>
                {errorMessage && (
                  <p role="alert" className="text-xs font-medium text-red-500">
                    {errorMessage}
                  </p>
                )}
              </fieldset>
            );
          }
          case "CHECKBOX":
            return (
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border border-border bg-card">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30"
                    checked={rhf.value === "true"}
                    onChange={(e) =>
                      rhf.onChange(e.target.checked ? "true" : "false")
                    }
                    onBlur={rhf.onBlur}
                    name={rhf.name}
                    ref={rhf.ref}
                  />
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1" aria-hidden>
                        *
                      </span>
                    )}
                  </span>
                </label>
                {errorMessage && (
                  <p role="alert" className="text-xs font-medium text-red-500">
                    {errorMessage}
                  </p>
                )}
              </div>
            );
          case "DATE":
            return (
              <Input
                type="date"
                label={field.label}
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
              />
            );
          case "NUMBER":
            return (
              <Input
                type="number"
                label={field.label}
                placeholder={`Digite seu ${field.label.toLowerCase()}`}
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
              />
            );
          case "EMAIL":
            return (
              <Input
                type="email"
                label={field.label}
                placeholder={`Digite seu ${field.label.toLowerCase()}`}
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
                autoComplete="email"
              />
            );
          default:
            return (
              <Input
                type="text"
                label={field.label}
                placeholder={`Digite seu ${field.label.toLowerCase()}`}
                value={rhf.value || ""}
                onChange={rhf.onChange}
                onBlur={rhf.onBlur}
                name={rhf.name}
                ref={rhf.ref}
                required={field.required}
                error={errorMessage}
              />
            );
        }
      }}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold">
            Carregando Checkout...
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
