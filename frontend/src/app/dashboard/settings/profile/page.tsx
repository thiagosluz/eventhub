'use client';

import { useState, useEffect } from 'react';
import { tenantsService, UpdateTenantDto } from '@/services/tenants.service';
import { Tenant } from '@/types/event';
import { toast } from 'react-hot-toast';
import { 
  GlobeAltIcon, 
  CameraIcon, 
  BriefcaseIcon, 
  HashtagIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<UpdateTenantDto>({
    bio: '',
    websiteUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    coverUrl: '',
  });

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const data = await tenantsService.getMe();
      setTenant(data);
      setFormData({
        bio: data.bio || '',
        websiteUrl: data.websiteUrl || '',
        instagramUrl: data.instagramUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        twitterUrl: data.twitterUrl || '',
        coverUrl: data.coverUrl || '',
      });
    } catch (error) {
      toast.error('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantsService.updateMe(formData);
      // Update local state to reflect changes in preview
      setTenant(prev => prev ? { ...prev, ...formData } : null);
      toast.success('Perfil público atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 2MB.');
      return;
    }

    const toastId = toast.loading('Enviando capa...');
    try {
      const updatedTenant = await tenantsService.uploadCover(file);
      setTenant(updatedTenant);
      setFormData(prev => ({ ...prev, coverUrl: updatedTenant.coverUrl }));
      toast.success('Capa atualizada!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao enviar capa.', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl">
      {/* Form Section */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Conteúdo do Perfil</h2>
          <p className="text-muted-foreground font-medium mt-1">Estas informações ajudam os participantes a conhecerem melhor sua organização.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bio Section */}
          <div className="premium-card p-8 bg-card border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <InformationCircleIcon className="w-5 h-5 text-primary" />
              <label className="text-sm font-black uppercase tracking-widest text-foreground">Sobre a Organização (Bio)</label>
            </div>
            <textarea
              className="premium-input w-full min-h-[160px] resize-none py-4"
              placeholder="Conte a história da sua organização, sua missão e o que os participantes podem esperar dos seus eventos..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground font-bold uppercase italic">Dica: Seja conciso e direto ao ponto.</p>
          </div>

          {/* Social Links Section */}
          <div className="premium-card p-8 bg-card border-border space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <GlobeAltIcon className="w-5 h-5 text-primary" />
              <label className="text-sm font-black uppercase tracking-widest text-foreground">Links e Redes Sociais</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <GlobeAltIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Website Oficial</span>
                </div>
                <input
                  type="url"
                  className="premium-input w-full text-sm font-bold"
                  placeholder="https://suaempresa.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <CameraIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</span>
                </div>
                <input
                  type="url"
                  className="premium-input w-full text-sm font-bold"
                  placeholder="https://instagram.com/usuario"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <BriefcaseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LinkedIn</span>
                </div>
                <input
                  type="url"
                  className="premium-input w-full text-sm font-bold"
                  placeholder="https://linkedin.com/company/sua-empresa"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <HashtagIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Twitter / X</span>
                </div>
                <input
                  type="url"
                  className="premium-input w-full text-sm font-bold"
                  placeholder="https://x.com/usuario"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="premium-card p-8 bg-card border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <PhotoIcon className="w-5 h-5 text-primary" />
              <label className="text-sm font-black uppercase tracking-widest text-foreground">Capa do Perfil (Banner)</label>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="relative group w-full h-48 rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden bg-card shadow-inner flex items-center justify-center">
                {formData.coverUrl ? (
                  <img src={formData.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-1">
                    <PhotoIcon className="w-8 h-8 opacity-30" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sem Banner Definido</span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2 z-10">
                  <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                  <ArrowUpTrayIcon className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-widest">Alterar Capa</span>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground italic">
                  O banner aparece no topo da sua página pública e ajuda a transmitir a identidade visual do seu evento.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  Tamanho sugerido: 1200x400px (3:1)
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="premium-button min-w-[200px]"
            >
              {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
            </button>
          </div>
        </form>
      </div>

      {/* Mini Preview Section */}
      <div className="space-y-6">
        <div className="sticky top-8">
          <div className="px-2 mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mini Preview Público</h3>
          </div>
          
          <div className="premium-card bg-card border-border overflow-hidden shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
            <div className={`h-28 relative ${!formData.coverUrl ? 'bg-primary/20' : ''}`}>
              {formData.coverUrl && (
                <img 
                  src={formData.coverUrl} 
                  alt="Banner Preview" 
                  className="w-full h-full object-cover" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 bg-card border-4 border-card rounded-2xl shadow-lg flex items-center justify-center overflow-hidden italic font-black text-2xl text-primary bg-muted">
                  {tenant?.logoUrl ? (
                    <Image 
                      src={tenant.logoUrl} 
                      alt="Logo" 
                      width={80}
                      height={80}
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    tenant?.name.slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-14 pb-8 px-8 space-y-4">
              <div>
                <h4 className="text-xl font-black tracking-tight">{tenant?.name}</h4>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{tenant?.slug}.eventhub.com.br</p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 italic">
                {formData.bio || "Sua biografia aparecerá aqui. Adicione uma descrição para atrair mais participantes!"}
              </p>

              <div className="flex gap-3 pt-2">
                {formData.websiteUrl && <GlobeAltIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help" title={formData.websiteUrl} />}
                {formData.instagramUrl && <CameraIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help" title={formData.instagramUrl} />}
                {formData.linkedinUrl && <BriefcaseIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help" title={formData.linkedinUrl} />}
                {formData.twitterUrl && <HashtagIcon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help" title={formData.twitterUrl} />}
              </div>

              <div className="pt-4 flex items-center justify-center border-t border-border border-dashed">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Exemplo de Card de Perfil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
