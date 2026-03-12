"use client";

import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NovoEventoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugFromName() {
    const s = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(s);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth("/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
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
        setError(data.message ?? "Erro ao criar evento.");
        return;
      }
      const event = await res.json();
      router.push(`/admin/eventos/${event.id}`);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Novo evento">
      <h1 className="text-2xl font-bold text-foreground mb-4">Novo evento</h1>
      <Link
        href="/admin/eventos"
        className="text-muted-foreground hover:text-foreground text-sm mb-4 inline-block focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        ← Voltar aos eventos
      </Link>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Nome do evento *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={slugFromName}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">
            Slug (URL) *
          </label>
          <input
            id="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="meu-evento"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">
            A página pública será /evento/{slug || "..."}
          </p>
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
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Data/hora início *
            </label>
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
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
              Data/hora fim *
            </label>
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
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
            Status
          </label>
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
          <label htmlFor="seoTitle" className="block text-sm font-medium text-foreground mb-1">
            Título SEO
          </label>
          <input
            id="seoTitle"
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-foreground mb-1">
            Descrição SEO
          </label>
          <textarea
            id="seoDescription"
            rows={2}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
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
          {loading ? "Criando…" : "Criar evento"}
        </button>
      </form>
    </section>
  );
}
