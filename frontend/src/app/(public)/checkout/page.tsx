"use client";

import { fetchWithAuth, getApiUrl, getToken } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options?: unknown;
};
type Form = { id: string; name: string; fields: FormField[] };
type EventPublic = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  activities: { id: string; title: string; startAt: string; endAt: string }[];
  forms: Form[];
};

function renderField(
  field: FormField,
  value: string,
  onChange: (v: string) => void
) {
  const common = {
    id: `field-${field.id}`,
    "aria-required": field.required,
    className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  };
  const options = Array.isArray(field.options) ? field.options : [];
  switch (field.type) {
    case "TEXTAREA":
      return (
        <textarea
          {...common}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      );
    case "SELECT":
      return (
        <select
          {...common}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Selecione</option>
          {options.map((opt: unknown) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
      );
    case "NUMBER":
      return (
        <input
          type="number"
          {...common}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DATE":
      return (
        <input
          type="date"
          {...common}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "CHECKBOX":
      return (
        <input
          type="checkbox"
          id={`field-${field.id}`}
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="rounded border-input"
        />
      );
    case "EMAIL":
      return (
        <input
          type="email"
          {...common}
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          {...common}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const isLoggedIn = typeof window !== "undefined" && !!getToken();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Informe o evento (parâmetro slug).");
      return;
    }
    fetch(`${getApiUrl()}/public/events/${slug}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Evento não encontrado");
        return res.json();
      })
      .then((data) => {
        setEvent(data);
        const initial: Record<string, string> = {};
        data.forms?.forEach((f: Form) => {
          f.fields?.forEach((field: FormField) => {
            initial[field.id] = field.type === "CHECKBOX" ? "false" : "";
          });
        });
        setFormValues(initial);
      })
      .catch(() => setError("Evento não encontrado."))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event || !isLoggedIn) return;
    setError(null);
    setSubmitting(true);
    try {
      const formResponses = event.forms?.map((f: Form) => ({
        formId: f.id,
        answers: f.fields.map((field: FormField) => ({
          fieldId: field.id,
          value: formValues[field.id] ?? "",
        })),
      })) ?? [];
      const res = await fetchWithAuth("/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          activityIds,
          formResponses,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.message ?? "Erro ao confirmar inscrição.";
        if (
          res.status === 403 &&
          typeof message === "string" &&
          message.includes("Capacidade máxima atingida")
        ) {
          setError(
            "Algumas atividades selecionadas já atingiram a capacidade máxima. Remova-as da seleção ou tente novamente mais tarde."
          );
        } else {
          setError(message);
        }
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="container max-w-2xl mx-auto px-4 py-12">
        <p className="text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  if (error && !event) {
    return (
      <section className="container max-w-2xl mx-auto px-4 py-12">
        <p className="text-destructive">{error}</p>
        <Link href="/" className="text-primary mt-2 inline-block">Voltar ao início</Link>
      </section>
    );
  }

  if (!isLoggedIn && event) {
    const redirect = `/checkout?slug=${encodeURIComponent(slug ?? "")}`;
    return (
      <section className="container max-w-2xl mx-auto px-4 py-12" aria-label="Checkout">
        <h1 className="text-2xl font-bold text-foreground mb-2">Inscrição: {event.name}</h1>
        <p className="text-muted-foreground mb-4">
          Faça login ou crie uma conta para continuar a inscrição.
        </p>
        <div className="flex gap-4">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Entrar
          </Link>
          <Link
            href={`/cadastro?redirect=${encodeURIComponent(redirect)}`}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Criar conta
          </Link>
        </div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="container max-w-2xl mx-auto px-4 py-12" aria-label="Inscrição confirmada">
        <h1 className="text-2xl font-bold text-foreground mb-2">Inscrição confirmada</h1>
        <p className="text-muted-foreground mb-4">
          Sua inscrição no evento <strong>{event?.name}</strong> foi realizada. Total pago: R$ 0,00.
        </p>
        <Link
          href={event?.slug ? `/evento/${event.slug}` : "/"}
          className="text-primary hover:underline"
        >
          Voltar ao evento
        </Link>
      </section>
    );
  }

  return (
    <section className="container max-w-2xl mx-auto px-4 py-12" aria-label="Checkout">
      <h1 className="text-2xl font-bold text-foreground mb-6">Checkout — {event?.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {event?.forms && event.forms.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Dados da inscrição</h2>
            {event.forms.map((form) => (
              <div key={form.id} className="space-y-4 mb-6">
                <h3 className="text-md font-medium text-foreground">{form.name}</h3>
                {form.fields.map((field) => (
                  <div key={field.id}>
                    <label
                      htmlFor={`field-${field.id}`}
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      {field.label}
                      {field.required && " *"}
                    </label>
                    {renderField(
                      field,
                      formValues[field.id] ?? "",
                      (v) => setFormValues((prev) => ({ ...prev, [field.id]: v }))
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {event?.activities && event.activities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Atividades (opcional)</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Você pode escolher participar de atividades específicas. Algumas podem ficar lotadas; caso isso aconteça, remova-as da seleção.
            </p>
            <ul className="space-y-2">
              {event.activities.map((act) => (
                <li key={act.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`act-${act.id}`}
                    checked={activityIds.includes(act.id)}
                    onChange={(e) => {
                      if (e.target.checked) setActivityIds((prev) => [...prev, act.id]);
                      else setActivityIds((prev) => prev.filter((id) => id !== act.id));
                    }}
                    className="rounded border-input"
                  />
                  <label htmlFor={`act-${act.id}`} className="text-sm text-foreground">
                    {act.title} — {new Date(act.startAt).toLocaleString("pt-BR")}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-border pt-6">
          <p className="text-lg font-semibold text-foreground">
            Total: R$ 0,00
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Inscrição gratuita. Em breve: opções de pagamento para eventos pagos.
          </p>
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {submitting ? "Confirmando…" : "Confirmar inscrição"}
        </button>
      </form>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="container py-12 text-muted-foreground">Carregando…</p>}>
      <CheckoutContent />
    </Suspense>
  );
}
