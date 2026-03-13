"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  capacity?: number | null;
  remainingSpots?: number | null;
  speakers: { id: string; name: string }[];
};

export default function ProgramacaoEventoPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/events/${eventId}/activities`)
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
          return [];
        }
        if (!res.ok) {
          setError("Erro ao carregar atividades.");
          return [];
        }
        return res.json();
      })
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setError("Erro de conexão."))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (unauthorized) {
    return (
      <section aria-label="Programação do evento">
        <h1 className="text-2xl font-bold text-foreground mb-4">Programação</h1>
        <p className="text-muted-foreground mb-4">Faça login para gerenciar a programação.</p>
        <Link
          href={`/login?redirect=/admin/eventos/${eventId}/programacao`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Entrar
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section aria-label="Programação do evento">
        <h1 className="text-2xl font-bold text-foreground mb-4">Programação</h1>
        <p className="text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Programação do evento">
        <h1 className="text-2xl font-bold text-foreground mb-4">Programação</h1>
        <p className="text-destructive" role="alert">{error}</p>
      </section>
    );
  }

  return (
    <section aria-label="Programação do evento">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Programação</h1>
        <Link
          href={`/admin/eventos/${eventId}`}
          className="text-muted-foreground hover:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          ← Voltar ao evento
        </Link>
        <Link
          href={`/admin/eventos/${eventId}/programacao/nova`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Nova atividade
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma atividade cadastrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.location && (
                    <p className="text-xs text-muted-foreground">{a.location}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.startAt).toLocaleString("pt-BR")} — {" "}
                  {new Date(a.endAt).toLocaleTimeString("pt-BR")}
                </p>
              </div>
              {a.description && (
                <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                <span>
                  {a.capacity != null
                    ? `Capacidade: ${a.capacity} · Vagas restantes: ${
                        a.remainingSpots ?? "—"
                      }`
                    : "Sem limite de vagas"}
                </span>
                <span>
                  {a.speakers.length > 0
                    ? `Palestrantes: ${a.speakers.map((s) => s.name).join(", ")}`
                    : "Sem palestrantes"}
                </span>
              </div>
              <div className="mt-2 flex gap-3 text-sm">
                <Link
                  href={`/admin/eventos/${eventId}/programacao/${a.id}`}
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
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

