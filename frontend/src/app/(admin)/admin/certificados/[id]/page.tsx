"use client";

import { fetchWithAuth, getApiUrl, getToken } from "@/lib/api";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PlaceholderType = "participantName" | "eventName" | "workload";
type Placeholder = { id: string; type: PlaceholderType; x: number; y: number; fontSize?: number };
type LayoutConfig = { placeholders: Placeholder[] };
type Template = {
  id: string;
  name: string;
  backgroundUrl: string;
  layoutConfig: LayoutConfig | null;
};

const PLACEHOLDER_LABELS: Record<PlaceholderType, string> = {
  participantName: "Nome do participante",
  eventName: "Nome do evento",
  workload: "Carga horária",
};

function DraggablePlaceholder({
  id,
  type,
  x,
  y,
  fontSize = 16,
}: Placeholder) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type, x, y },
  });
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    fontSize: `${fontSize}px`,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    padding: "4px 8px",
    background: "rgba(255,255,255,0.9)",
    border: "1px dashed #666",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    zIndex: isDragging ? 1000 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {PLACEHOLDER_LABELS[type]}
    </div>
  );
}

export default function ConstrutorCertificadoPage() {
  const params = useParams();
  const id = params.id as string;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  const loadTemplate = useCallback(async () => {
    const res = await fetchWithAuth(`/certificate-templates/${id}`);
    if (res.status === 401) {
      setError("Faça login para acessar.");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Template não encontrado.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTemplate(data);
    const config = (data.layoutConfig as LayoutConfig) ?? { placeholders: [] };
    const list = Array.isArray(config.placeholders) ? config.placeholders : [];
    setPlaceholders(list.length > 0 ? list : [
      { id: "p1", type: "participantName", x: 20, y: 40 },
      { id: "p2", type: "eventName", x: 20, y: 50 },
      { id: "p3", type: "workload", x: 20, y: 60 },
    ]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const el = canvasRef.current;
    if (!el || !delta) return;
    const rect = el.getBoundingClientRect();
    const percentX = (delta.x / rect.width) * 100;
    const percentY = (delta.y / rect.height) * 100;
    setPlaceholders((prev) =>
      prev.map((p) =>
        p.id === active.id
          ? { ...p, x: Math.max(0, Math.min(100, p.x + percentX)), y: Math.max(0, Math.min(100, p.y + percentY)) }
          : p
      )
    );
  }

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/certificate-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutConfig: { placeholders } }),
      });
      if (!res.ok) {
        setError("Erro ao salvar.");
        return;
      }
      setError(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingBg(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${getApiUrl()}/certificate-templates/${id}/background`, {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: form,
      });
      if (!res.ok) {
        setError("Erro ao enviar imagem de fundo.");
        return;
      }
      const updated = await res.json();
      setTemplate((t) => (t ? { ...t, backgroundUrl: updated.backgroundUrl } : null));
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  }

  function addPlaceholder(type: PlaceholderType) {
    const newId = `p-${Date.now()}`;
    setPlaceholders((prev) => [...prev, { id: newId, type, x: 20, y: 20 + prev.length * 10 }]);
  }

  if (loading) {
    return (
      <section aria-label="Construtor de certificado">
        <p className="text-muted-foreground">Carregando…</p>
      </section>
    );
  }

  if (error && !template) {
    return (
      <section aria-label="Construtor de certificado">
        <p className="text-destructive">{error}</p>
        <Link href="/admin/certificados" className="text-sm text-primary mt-2 inline-block">
          Voltar aos certificados
        </Link>
      </section>
    );
  }

  return (
    <section aria-label={`Editar template: ${template?.name ?? ""}`}>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Link
          href="/admin/certificados"
          className="text-muted-foreground hover:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          ← Certificados
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{template?.name ?? "Template"}</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar layout"}
        </button>
        <label className="rounded-md border border-input px-4 py-2 text-sm cursor-pointer hover:bg-accent">
          {uploadingBg ? "Enviando…" : "Trocar imagem de fundo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleBackgroundUpload}
            disabled={uploadingBg}
          />
        </label>
      </div>

      {error && (
        <p className="text-destructive text-sm mb-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-6 flex-wrap">
        <div className="flex-shrink-0">
          <p className="text-sm font-medium text-foreground mb-2">Campos disponíveis</p>
          <ul className="space-y-1">
            {(Object.keys(PLACEHOLDER_LABELS) as PlaceholderType[]).map((type) => (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => addPlaceholder(type)}
                  className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  + {PLACEHOLDER_LABELS[type]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 min-w-[300px]">
          <p className="text-sm font-medium text-foreground mb-2">Arraste os campos para posicionar</p>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              ref={canvasRef}
              className="relative bg-muted rounded-lg overflow-hidden"
              style={{ aspectRatio: "297/210", maxWidth: "600px" }}
              role="img"
              aria-label="Preview do certificado"
            >
              {template?.backgroundUrl && (
                <img
                  src={template.backgroundUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              {placeholders.map((p) => (
                <DraggablePlaceholder key={p.id} {...p} />
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </section>
  );
}
