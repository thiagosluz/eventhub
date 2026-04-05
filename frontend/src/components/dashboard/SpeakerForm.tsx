"use client";

import { useState } from "react";
import { Speaker, Ticket } from "@/types/event";
import { PhotoIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { speakersService } from "@/services/speakers.service";

interface SpeakerFormProps {
  initialData?: Partial<Speaker>;
  onSubmit: (data: Partial<Speaker>) => Promise<void>;
  isLoading: boolean;
}

export function SpeakerForm({ initialData, onSubmit, isLoading }: SpeakerFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    bio: initialData?.bio || "",
    avatarUrl: initialData?.avatarUrl || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    websiteUrl: initialData?.websiteUrl || "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await speakersService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card rounded-3xl border border-border p-8 shadow-sm">
      <div className="space-y-8">
        {/* Perfil e Avatar */}
        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-card shadow-xl group-hover:border-primary/20 transition-all">
              {formData.avatarUrl ? (
                <Image 
                  src={formData.avatarUrl} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-muted-foreground/30" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
              <PhotoIcon className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div>
              <label htmlFor="name" className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
                Nome do Palestrante
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Ex: Dr. Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-xl font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
                E-mail (Opcional)
              </label>
              <input
                id="email"
                type="email"
                placeholder="jane.doe@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 bg-muted border-none rounded-xl px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Informações Profissionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label htmlFor="bio" className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
              Biografia / Mini Currículo
            </label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Breve descrição sobre a experiência e conquistas do palestrante..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-muted border-none rounded-2xl p-6 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 resize-none font-medium text-lg leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
              LinkedIn
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://linkedin.com/in/perfil"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full h-12 bg-muted border-none rounded-xl px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
              Website / Portfólio
            </label>
            <input
              type="url"
              placeholder="https://janedoe.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full h-12 bg-muted border-none rounded-xl px-4 text-foreground focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-8 border-t border-border">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || isUploading}
          className="premium-button min-w-[180px]"
        >
          {isLoading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Criar Palestrante"}
        </button>
      </div>
    </form>
  );
}
