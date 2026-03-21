"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { speakersService, Speaker } from "@/services/speakers.service";
import { 
  UserIcon, 
  CheckIcon,
  GlobeAltIcon,
  CameraIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function SpeakerProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<Speaker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    email: "",
    linkedinUrl: "",
    websiteUrl: "",
    avatarUrl: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await speakersService.getMe();
      setProfile(data);
      setFormData({
        name: data.name || "",
        bio: data.bio || "",
        email: data.email || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
        avatarUrl: data.avatarUrl || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await speakersService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      toast.error("Erro ao subir imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const updated = await speakersService.updateSpeaker(profile.id, formData);
      setProfile(updated);
      updateUser({ avatarUrl: updated.avatarUrl }); // Sincroniza com auth context se necessário
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-64 bg-card rounded-3xl animate-pulse" />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div>
        <h1 className="text-3xl font-black text-foreground">Meu Perfil Público</h1>
        <p className="text-muted-foreground mt-1">
          Estas informações serão exibidas para os participantes do evento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="premium-card bg-card border-border p-8 md:p-12 space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border/50">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-muted overflow-hidden border-4 border-border shadow-xl">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-sm">
                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={isUploading} />
                <CameraIcon className="w-8 h-8" />
              </label>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[2rem] backdrop-blur-sm">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-lg font-black text-foreground">Sua Foto de Perfil</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Use uma foto profissional de alta resolução. Formatos aceitos: JPG, PNG ou WebP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="premium-input w-full" 
                placeholder="Ex: Dr. Jane Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Profissional</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="premium-input w-full" 
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Biografia Curta</label>
            <textarea 
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="premium-input w-full min-h-[150px] py-4" 
              placeholder="Fale um pouco sobre sua trajetória, especialidades e conquistas..."
            />
            <p className="text-[10px] text-muted-foreground text-right italic">Mínimo sugerido: 50 caracteres.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">LinkedIn URL</label>
              <div className="relative">
                <input 
                  type="url" 
                  value={formData.linkedinUrl}
                  onChange={e => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="premium-input w-full pl-11" 
                  placeholder="https://linkedin.com/in/usuario"
                />
                <GlobeAltIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Website Oficial</label>
              <div className="relative">
                <input 
                  type="url" 
                  value={formData.websiteUrl}
                  onChange={e => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="premium-input w-full pl-11" 
                  placeholder="https://seusite.com"
                />
                <GlobeAltIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="premium-button !px-12 !py-4 flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
