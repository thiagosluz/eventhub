"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type Event = { id: string; name: string; slug: string };
type Template = { id: string; name: string; backgroundUrl: string; createdAt: string };

export default function AdminCertificadosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetchWithAuth("/events");
      if (res.status === 401) {
        setError("Faça login para acessar.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Erro ao carregar eventos.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTemplates([]);
      return;
    }
    setLoadingTemplates(true);
    fetchWithAuth(`/events/${selectedEventId}/certificate-templates`)
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingTemplates(false));
  }, [selectedEventId]);

  if (loading) {
    return (
      <section aria-label="Certificados">
        <p className="text-muted-foreground">Carregando eventos…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Certificados">
        <p className="text-destructive">{error}</p>
      </section>
    );
  }

  return (
    <section aria-label="Templates de certificados">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Templates de certificados
      </h1>

      <div className="mb-6">
        <label htmlFor="event-select" className="block text-sm font-medium text-foreground mb-2">
          Evento
        </label>
        <select
          id="event-select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-describedby="event-select-desc"
        >
          <option value="">Selecione um evento</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
        <p id="event-select-desc" className="text-muted-foreground text-sm mt-1">
          Escolha o evento para listar e criar templates de certificado.
        </p>
      </div>

      {selectedEventId && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/admin/certificados/novo?eventId=${selectedEventId}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Novo template
            </Link>
          </div>

          {loadingTemplates ? (
            <p className="text-muted-foreground">Carregando templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum template ainda. Crie um com &quot;Novo template&quot;.
            </p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/certificados/${t.id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (editar)
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
