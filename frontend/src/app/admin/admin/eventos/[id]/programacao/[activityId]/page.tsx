"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  capacity?: number | null;
};

function formatDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function EditarAtividadePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const activityId = params.activityId as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          setError("Erro ao carregar atividade.");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        const list: Activity[] = Array.isArray(data) ? data : [];
        const found = list.find((a) => a.id === activityId) || null;
        if (!found) {
          setError("Atividade não encontrada.");
          setLoading(false);
          return;
        }
        setActivity(found);
        setTitle(found.title);
        setDescription(found.description ?? "");
        setLocation(found.location ?? "");
        setStartAt(found.startAt ? formatDateTimeLocal(found.startAt) : "");
        setEndAt(found.endAt ? formatDateTimeLocal(found.endAt) : "");
        setCapacity(found.capacity != null ? String(found.capacity) : "");
        setLoading(false);
      })
      .catch(() => {
        setError("Erro de conexão.");
        setLoading(false);
      });
  }, [eventId, activityId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activity) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startAt: startAt || undefined,
          endAt: endAt || undefined,
          capacity: capacity ? Number(capacity) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Erro ao salvar atividade.");
        return;
      }
      router.push(`/admin/eventos/${eventId}/programacao`);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  if (unauthorized) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-4">Editar atividade</h1>
        <p className="text-muted-foreground mb-4">Faça login para editar.</p>
        <Link href={`/login?redirect=/admin/eventos/${eventId}/programacao/${activityId}`} className="text-primary hover:underline">
          Entrar
        </Link>
      </section>
    );
  }

  if (loading || !activity) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-4">Editar atividade</h1>
        <p className="text-muted-foreground">{loading ? "Carregando…" : error ?? "Atividade não encontrada."}</p>
      </section>
    );
  }

  return (
    <section aria-label={`Editar atividade: ${activity.title}`}>
      <h1 className="text-2xl font-bold text-foreground mb-4">Editar atividade</h1>
      <Link
        href={`/admin/eventos/${eventId}/programacao`}
        className="text-muted-foreground hover:text-foreground text-sm mb-4 inline-block focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        ← Voltar para programação
      </Link>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Título *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
            Local
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startAt" className="block text-sm font-medium text-foreground mb-1">
              Início *
            </label>
            <input
              id="startAt"
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="endAt" className="block text-sm font-medium text-foreground mb-1">
              Fim *
            </label>
            <input
              id="endAt"
              type="datetime-local"
              required
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-foreground mb-1">
            Capacidade (opcional)
          </label>
          <input
            id="capacity"
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
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
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}

