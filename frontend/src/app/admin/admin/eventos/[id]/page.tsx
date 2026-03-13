"use client";

import { fetchWithAuth, getApiUrl, getToken } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

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
  seoTitle?: string | null;
  seoDescription?: string | null;
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

export default function EditarEventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const loadEvent = useCallback(async () => {
    const res = await fetchWithAuth("/events");
    if (res.status === 401) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Erro ao carregar evento.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const ev = list.find((e: Event) => e.id === id);
    if (!ev) {
      setError("Evento não encontrado.");
      setLoading(false);
      return;
    }
    setEvent(ev);
    setName(ev.name);
    setSlug(ev.slug);
    setDescription(ev.description ?? "");
    setLocation(ev.location ?? "");
    setStartDate(ev.startDate ? formatDateTimeLocal(ev.startDate) : "");
    setEndDate(ev.endDate ? formatDateTimeLocal(ev.endDate) : "");
    setSeoTitle(ev.seoTitle ?? "");
    setSeoDescription(ev.seoDescription ?? "");
    setStatus(ev.status ?? "DRAFT");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Erro ao salvar.");
        return;
      }
      const updated = await res.json();
      setEvent(updated);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    setUploadingBanner(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${getApiUrl()}/events/${event.id}/banner`, {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload falhou");
      const updated = await res.json();
      setEvent((prev) => (prev ? { ...prev, bannerUrl: updated.bannerUrl } : null));
    } catch {
      setError("Erro ao enviar banner.");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${getApiUrl()}/events/${event.id}/logo`, {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload falhou");
      const updated = await res.json();
      setEvent((prev) => (prev ? { ...prev, logoUrl: updated.logoUrl } : null));
    } catch {
      setError("Erro ao enviar logo.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  if (unauthorized) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-4">Editar evento</h1>
        <p className="text-muted-foreground mb-4">Faça login para editar.</p>
        <Link href={`/login?redirect=/admin/eventos/${id}`} className="text-primary hover:underline">
          Entrar
        </Link>
      </section>
    );
  }

  if (loading || !event) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-4">Editar evento</h1>
        <p className="text-muted-foreground">{loading ? "Carregando…" : error ?? "Evento não encontrado."}</p>
      </section>
    );
  }

  return (
    <section aria-label={`Editar: ${event.name}`}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Editar evento</h1>
        <Link
          href="/admin/eventos"
          className="text-muted-foreground hover:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          ← Voltar aos eventos
        </Link>
        <a
          href={`/evento/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Ver página pública
        </a>
        <Link
          href={`/admin/eventos/${event.id}/programacao`}
          className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          Ver programação
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-6">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Banner</p>
          {event.bannerUrl ? (
            <img src={event.bannerUrl} alt="" className="h-24 rounded object-cover mb-2" />
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Nenhum banner</p>
          )}
          <label className="inline-block rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent">
            {uploadingBanner ? "Enviando…" : "Trocar banner"}
            <input type="file" accept="image/*" className="sr-only" onChange={handleBannerUpload} disabled={uploadingBanner} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Logo</p>
          {event.logoUrl ? (
            <img src={event.logoUrl} alt="" className="h-16 rounded object-contain mb-2" />
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Nenhum logo</p>
          )}
          <label className="inline-block rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent">
            {uploadingLogo ? "Enviando…" : "Trocar logo"}
            <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} disabled={uploadingLogo} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Nome *</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">Slug (URL) *</label>
          <input
            id="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Local</label>
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
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">Início *</label>
            <input
              id="startDate"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">Fim *</label>
            <input
              id="endDate"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Apenas eventos com status &quot;Publicado&quot; aparecem na página pública /evento/[slug].
          </p>
        </div>
        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-foreground mb-1">Título SEO</label>
          <input
            id="seoTitle"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-foreground mb-1">Descrição SEO</label>
          <textarea
            id="seoDescription"
            rows={2}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error && (
          <p className="text-destructive text-sm" role="alert">{error}</p>
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
