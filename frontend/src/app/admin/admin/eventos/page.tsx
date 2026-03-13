"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  bannerUrl?: string | null;
  logoUrl?: string | null;
};

export default function AdminEventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchWithAuth("/events")
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
          return [];
        }
        if (!res.ok) {
          setError("Erro ao carregar eventos.");
          return [];
        }
        return res.json();
      })
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setError("Erro de conexão."))
      .finally(() => setLoading(false));
  }, []);

  if (unauthorized) {
    return (
      <section aria-label="Meus eventos">
        <h1 className="text-2xl font-bold text-foreground mb-4">Meus eventos</h1>
        <p className="text-muted-foreground mb-4">
          Faça login para ver e gerenciar seus eventos.
        </p>
        <Link
          href="/login?redirect=/admin/eventos"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Entrar
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section aria-label="Meus eventos">
        <h1 className="text-2xl font-bold text-foreground mb-4">Meus eventos</h1>
        <p className="text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Meus eventos">
        <h1 className="text-2xl font-bold text-foreground mb-4">Meus eventos</h1>
        <p className="text-destructive" role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section aria-label="Meus eventos">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Meus eventos</h1>
        <Link
          href="/admin/eventos/novo"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Novo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum evento ainda. Crie um com &quot;Novo evento&quot;.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              {ev.bannerUrl ? (
                <img
                  src={ev.bannerUrl}
                  alt=""
                  className="h-14 w-24 rounded object-cover"
                />
              ) : (
                <div className="h-14 w-24 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  Sem banner
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{ev.name}</p>
                <p className="text-sm text-muted-foreground">
                  /evento/{ev.slug} ·{" "}
                  {ev.status === "PUBLISHED"
                    ? "Publicado"
                    : ev.status === "ARCHIVED"
                    ? "Arquivado"
                    : "Rascunho"}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/evento/${ev.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  Ver página
                </a>
                <Link
                  href={`/admin/eventos/${ev.id}`}
                  className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
