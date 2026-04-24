"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { speakersService, Speaker } from "@/services/speakers.service";
import {
  UserIcon,
  CheckIcon,
  GlobeAltIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { Button, Input, Textarea } from "@/components/ui";
import { speakerSchema, type SpeakerInput } from "@/lib/validation/speakers";

export default function SpeakerProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<Speaker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SpeakerInput>({
    resolver: zodResolver(speakerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      avatarUrl: "",
      linkedinUrl: "",
      websiteUrl: "",
    },
  });

  const avatarUrl = watch("avatarUrl");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await speakersService.getMe();
        setProfile(data);
        reset({
          name: data.name || "",
          email: data.email || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          websiteUrl: data.websiteUrl || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [reset]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await speakersService.uploadAvatar(file);
      setValue("avatarUrl", url, { shouldDirty: true });
      toast.success("Foto carregada com sucesso!");
    } catch {
      toast.error("Erro ao subir imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: SpeakerInput) => {
    if (!profile) return;
    try {
      const updated = await speakersService.updateSpeaker(profile.id, values);
      setProfile(updated);
      updateUser({ avatarUrl: updated.avatarUrl });
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar alterações.");
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="premium-card bg-card border-border p-8 md:p-12 space-y-8">
          <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border/50">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-muted overflow-hidden border-4 border-border shadow-xl">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-sm">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  disabled={isUploading}
                />
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
                Use uma foto profissional de alta resolução. Formatos aceitos: JPG,
                PNG ou WebP.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="speaker-name"
              label="Nome Completo"
              required
              placeholder="Ex: Dr. Jane Doe"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="speaker-email"
              type="email"
              label="E-mail Profissional"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <Textarea
            id="speaker-bio"
            label="Biografia Curta"
            rows={6}
            placeholder="Fale um pouco sobre sua trajetória, especialidades e conquistas..."
            helperText="Mínimo sugerido: 50 caracteres."
            error={errors.bio?.message}
            {...register("bio")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Input
              id="speaker-linkedin"
              type="url"
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/usuario"
              leftAddon={<GlobeAltIcon className="w-4 h-4" />}
              error={errors.linkedinUrl?.message}
              {...register("linkedinUrl")}
            />
            <Input
              id="speaker-website"
              type="url"
              label="Website Oficial"
              placeholder="https://seusite.com"
              leftAddon={<GlobeAltIcon className="w-4 h-4" />}
              error={errors.websiteUrl?.message}
              {...register("websiteUrl")}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            disabled={isUploading}
            leftIcon={<CheckIcon className="w-5 h-5" />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
