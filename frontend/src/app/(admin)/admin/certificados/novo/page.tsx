"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

type Event = { id: string; name: string; slug: string };

function NovoCertificadoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromQuery = searchParams.get("eventId") ?? "";
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState(eventIdFromQuery);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth("/events")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEvents(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (eventIdFromQuery) setEventId(eventIdFromQuery);
  }, [eventIdFromQuery]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!eventId || !name.trim()) {
      setError("Selecione o evento e informe o nome do template.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/events/${eventId}/certificate-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          backgroundUrl: "",
          layoutConfig: { placeholders: [] },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message ?? "Erro ao criar template.");
        return;
      }
      const template = await res.json();
      router.push(`/admin/certificados/${template.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Novo template de certificado">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Novo template de certificado
      </h1>
      <Link
        href="/admin/certificados"
        className="text-muted-foreground hover:text-foreground text-sm mb-4 inline-block focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        ← Voltar aos certificados
      </Link>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="event" className="block text-sm font-medium text-foreground mb-1">
            Evento
          </label>
          <select
            id="event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Nome do template
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Certificado de participação"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {loading ? "Criando…" : "Criar e editar layout"}
        </button>
      </form>
    </section>
  );
}

export default function NovoCertificadoPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
      <NovoCertificadoForm />
    </Suspense>
  );
}
