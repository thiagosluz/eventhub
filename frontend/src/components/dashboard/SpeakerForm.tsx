"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhotoIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Speaker } from "@/types/event";
import { speakersService } from "@/services/speakers.service";
import { Button, Input, Textarea } from "@/components/ui";
import { speakerSchema, type SpeakerInput } from "@/lib/validation/speakers";

interface SpeakerFormProps {
  initialData?: Partial<Speaker>;
  onSubmit: (data: Partial<Speaker>) => Promise<void>;
  isLoading: boolean;
}

export function SpeakerForm({ initialData, onSubmit, isLoading }: SpeakerFormProps) {
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SpeakerInput>({
    resolver: zodResolver(speakerSchema),
    mode: "onBlur",
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      bio: initialData?.bio ?? "",
      avatarUrl: initialData?.avatarUrl ?? "",
      linkedinUrl: initialData?.linkedinUrl ?? "",
      websiteUrl: initialData?.websiteUrl ?? "",
    },
  });

  const avatarUrl = watch("avatarUrl");

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? "",
        email: initialData.email ?? "",
        bio: initialData.bio ?? "",
        avatarUrl: initialData.avatarUrl ?? "",
        linkedinUrl: initialData.linkedinUrl ?? "",
        websiteUrl: initialData.websiteUrl ?? "",
      });
    }
  }, [initialData, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await speakersService.uploadAvatar(file);
      setValue("avatarUrl", url, { shouldDirty: true });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async (values: SpeakerInput) => {
    await onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-8 bg-card rounded-3xl border border-border p-8 shadow-sm"
      noValidate
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-border">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-card shadow-xl group-hover:border-primary/20 transition-all">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Preview"
                  fill
                  sizes="128px"
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
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <Input
              id="name"
              label="Nome do Palestrante"
              required
              placeholder="Ex: Dr. Jane Doe"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="email"
              type="email"
              label="E-mail (Opcional)"
              placeholder="jane.doe@exemplo.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Textarea
              id="bio"
              label="Biografia / Mini Currículo"
              rows={4}
              placeholder="Breve descrição sobre a experiência e conquistas do palestrante..."
              error={errors.bio?.message}
              {...register("bio")}
            />
          </div>

          <Input
            id="linkedinUrl"
            type="url"
            label="LinkedIn"
            placeholder="https://linkedin.com/in/perfil"
            error={errors.linkedinUrl?.message}
            {...register("linkedinUrl")}
          />

          <Input
            id="websiteUrl"
            type="url"
            label="Website / Portfólio"
            placeholder="https://janedoe.com"
            error={errors.websiteUrl?.message}
            {...register("websiteUrl")}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-8 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isUploading}
        >
          {initialData?.id ? "Salvar Alterações" : "Criar Palestrante"}
        </Button>
      </div>
    </form>
  );
}
