"use client";

import { useState } from "react";
import { Speaker } from "@/types/event";
import { PhotoIcon, UserIcon } from "@heroicons/react/24/outline";

interface SpeakerFormProps {
  initialData?: Partial<Speaker>;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function SpeakerForm({ initialData, onSubmit, isLoading }: SpeakerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    bio: initialData?.bio || "",
    avatarUrl: initialData?.avatarUrl || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card rounded-3xl border border-border p-8 shadow-sm">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-black text-foreground uppercase tracking-wider mb-2">
            Nome do Palestrante
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Dr. Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-12 bg-muted border-none rounded-xl px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-foreground uppercase tracking-wider mb-2">
            Biografia / Mini Currículo
          </label>
          <textarea
            rows={4}
            placeholder="Breve descrição sobre a experiência e conquistas do palestrante..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-muted border-none rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 resize-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-black text-foreground uppercase tracking-wider mb-2">
            URL do Avatar / Foto
          </label>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground border border-border">
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </div>
            <input
              type="url"
              placeholder="https://exemplo.com/foto.jpg"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full h-12 bg-muted border-none rounded-xl px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Insira uma URL direta para a imagem (LinkedIn, GitHub ou hospedagem externa).
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="premium-button min-w-[140px]"
        >
          {isLoading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Criar Palestrante"}
        </button>
      </div>
    </form>
  );
}
