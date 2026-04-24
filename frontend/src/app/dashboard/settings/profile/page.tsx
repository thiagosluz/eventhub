'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantsService } from '@/services/tenants.service';
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
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Button, Input, Textarea } from '@/components/ui';
import {
  updateTenantSchema,
  type UpdateTenantInput,
} from '@/lib/validation/tenants';

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    mode: 'onBlur',
    defaultValues: {
      bio: '',
      websiteUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      twitterUrl: '',
      coverUrl: '',
    },
  });

  const bio = watch('bio');
  const websiteUrl = watch('websiteUrl');
  const instagramUrl = watch('instagramUrl');
  const linkedinUrl = watch('linkedinUrl');
  const twitterUrl = watch('twitterUrl');
  const coverUrl = watch('coverUrl');

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const data = await tenantsService.getMe();
        setTenant(data);
        reset({
          bio: data.bio || '',
          websiteUrl: data.websiteUrl || '',
          instagramUrl: data.instagramUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          twitterUrl: data.twitterUrl || '',
          coverUrl: data.coverUrl || '',
        });
      } catch {
        toast.error('Erro ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    };
    loadTenant();
  }, [reset]);

  const onSubmit = async (values: UpdateTenantInput) => {
    try {
      await tenantsService.updateMe(values);
      setTenant((prev) => (prev ? { ...prev, ...values } : null));
      toast.success('Perfil público atualizado!');
    } catch {
      toast.error('Erro ao salvar perfil.');
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
      setValue('coverUrl', updatedTenant.coverUrl || '', { shouldDirty: true });
      toast.success('Capa atualizada!', { id: toastId });
    } catch {
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
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Conteúdo do Perfil
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            Estas informações ajudam os participantes a conhecerem melhor sua
            organização.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          <div className="premium-card p-8 bg-card border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <InformationCircleIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-foreground">
                Sobre a Organização (Bio)
              </span>
            </div>
            <Textarea
              id="bio"
              rows={6}
              placeholder="Conte a história da sua organização, sua missão e o que os participantes podem esperar dos seus eventos..."
              error={errors.bio?.message}
              {...register('bio')}
            />
            <p className="text-[10px] text-muted-foreground font-bold uppercase italic">
              Dica: Seja conciso e direto ao ponto.
            </p>
          </div>

          <div className="premium-card p-8 bg-card border-border space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <GlobeAltIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-foreground">
                Links e Redes Sociais
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="websiteUrl"
                type="url"
                label="Website Oficial"
                placeholder="https://suaempresa.com"
                leftAddon={<GlobeAltIcon className="w-4 h-4" />}
                error={errors.websiteUrl?.message}
                {...register('websiteUrl')}
              />
              <Input
                id="instagramUrl"
                type="url"
                label="Instagram"
                placeholder="https://instagram.com/usuario"
                leftAddon={<CameraIcon className="w-4 h-4" />}
                error={errors.instagramUrl?.message}
                {...register('instagramUrl')}
              />
              <Input
                id="linkedinUrl"
                type="url"
                label="LinkedIn"
                placeholder="https://linkedin.com/company/sua-empresa"
                leftAddon={<BriefcaseIcon className="w-4 h-4" />}
                error={errors.linkedinUrl?.message}
                {...register('linkedinUrl')}
              />
              <Input
                id="twitterUrl"
                type="url"
                label="Twitter / X"
                placeholder="https://x.com/usuario"
                leftAddon={<HashtagIcon className="w-4 h-4" />}
                error={errors.twitterUrl?.message}
                {...register('twitterUrl')}
              />
            </div>
          </div>

          <div className="premium-card p-8 bg-card border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <PhotoIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-foreground">
                Capa do Perfil (Banner)
              </span>
            </div>

            <div className="flex flex-col gap-6">
              <div className="relative group w-full h-48 rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden shadow-inner flex items-center justify-center">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-1">
                    <PhotoIcon className="w-8 h-8 opacity-30" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Sem Banner Definido
                    </span>
                  </div>
                )}
                <label className="absolute inset-0 cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2 z-10">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverUpload}
                  />
                  <ArrowUpTrayIcon className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Alterar Capa
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground italic">
                  O banner aparece no topo da sua página pública e ajuda a
                  transmitir a identidade visual do seu evento.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                  Tamanho sugerido: 1200x400px (3:1)
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" isLoading={isSubmitting}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="sticky top-8">
          <div className="px-2 mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Mini Preview Público
            </h3>
          </div>

          <div className="premium-card bg-card border-border overflow-hidden shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
            <div className={`h-28 relative ${!coverUrl ? 'bg-primary/20' : ''}`}>
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
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
                <h4 className="text-xl font-black tracking-tight">
                  {tenant?.name}
                </h4>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {tenant?.slug}.eventhub.com.br
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 italic">
                {bio ||
                  'Sua biografia aparecerá aqui. Adicione uma descrição para atrair mais participantes!'}
              </p>

              <div className="flex gap-3 pt-2">
                {websiteUrl && (
                  <GlobeAltIcon
                    className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help"
                    title={websiteUrl}
                  />
                )}
                {instagramUrl && (
                  <CameraIcon
                    className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help"
                    title={instagramUrl}
                  />
                )}
                {linkedinUrl && (
                  <BriefcaseIcon
                    className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help"
                    title={linkedinUrl}
                  />
                )}
                {twitterUrl && (
                  <HashtagIcon
                    className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors cursor-help"
                    title={twitterUrl}
                  />
                )}
              </div>

              <div className="pt-4 flex items-center justify-center border-t border-border border-dashed">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                  Exemplo de Card de Perfil
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
