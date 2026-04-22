"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import {
  UserCircleIcon,
  KeyIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/context/AuthContext";
import { usersService } from "@/services/users.service";
import { Button, Input, Textarea } from "@/components/ui";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validation/user";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      publicProfile: false,
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const publicProfile = profileForm.watch("publicProfile");

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const data = await usersService.getMe();
        if (!active) return;
        profileForm.reset({
          name: data.name,
          email: data.email,
          bio: data.bio || "",
          publicProfile: data.publicProfile || false,
        });
      } catch {
        toast.error("Erro ao carregar dados do perfil.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, [profileForm]);

  const onSubmitProfile = async (values: UpdateProfileInput) => {
    try {
      const updated = await usersService.updateProfile({
        name: values.name,
        email: values.email,
        bio: values.bio || "",
        publicProfile: values.publicProfile,
      });
      updateUser(updated);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar perfil.";
      toast.error(message);
    }
  };

  const onSubmitPassword = async (values: ChangePasswordInput) => {
    try {
      await usersService.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Senha alterada com sucesso!");
      passwordForm.reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao alterar senha.";
      toast.error(message);
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading("Enviando foto...");
    try {
      const { avatarUrl } = await usersService.uploadAvatar(file);
      updateUser({ avatarUrl });
      toast.success("Foto de perfil atualizada!", { id: loadingToast });
    } catch {
      toast.error("Erro ao enviar foto.", { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">
          Carregando perfil...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground font-medium">
          Gerencie suas informações pessoais e configurações de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card p-8 bg-card border-border">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
              <UserCircleIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-tight">
                Informações Pessoais
              </h2>
            </div>

            <form
              onSubmit={profileForm.handleSubmit(onSubmitProfile)}
              className="space-y-6"
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="full-name"
                  label="Nome Completo"
                  required
                  error={profileForm.formState.errors.name?.message}
                  {...profileForm.register("name")}
                />
                <Input
                  id="email"
                  type="email"
                  label="Endereço de E-mail"
                  required
                  autoComplete="email"
                  error={profileForm.formState.errors.email?.message}
                  {...profileForm.register("email")}
                />
              </div>

              <Textarea
                id="bio"
                label="Bio (Opcional)"
                placeholder="Conte um pouco sobre você..."
                error={profileForm.formState.errors.bio?.message}
                {...profileForm.register("bio")}
              />

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase tracking-widest text-primary block">
                    Visibilidade Pública
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Permitir que meu perfil seja listado na página pública da
                    organização.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={publicProfile}
                  aria-label="Alternar visibilidade pública do perfil"
                  onClick={() =>
                    profileForm.setValue("publicProfile", !publicProfile, {
                      shouldDirty: true,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    publicProfile ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      publicProfile ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={profileForm.formState.isSubmitting}
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>

          <div className="premium-card p-8 bg-card border-border">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4">
              <KeyIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-tight">
                Segurança
              </h2>
            </div>

            <form
              onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
              className="space-y-6"
              noValidate
            >
              <Input
                id="current-password"
                type="password"
                label="Senha Atual"
                autoComplete="current-password"
                required
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register("currentPassword")}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="new-password"
                  type="password"
                  label="Nova Senha"
                  autoComplete="new-password"
                  required
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register("newPassword")}
                />
                <Input
                  id="confirm-password"
                  type="password"
                  label="Confirmar Nova Senha"
                  autoComplete="new-password"
                  required
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register("confirmPassword")}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  isLoading={passwordForm.formState.isSubmitting}
                >
                  Atualizar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="premium-card p-8 bg-card border-border flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-8 border-b border-border pb-4 w-full">
              <PhotoIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold uppercase tracking-tight">
                Foto de Perfil
              </h2>
            </div>

            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl bg-muted overflow-hidden border-4 border-white shadow-xl">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserCircleIcon className="w-20 h-20 opacity-20" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 cursor-pointer rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2 z-10">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <ArrowUpTrayIcon className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Alterar Foto
                </span>
              </label>
            </div>

            <p className="mt-6 text-xs text-muted-foreground font-medium max-w-[200px]">
              Use uma foto quadrada de alta resolução (JPG ou PNG) para melhores
              resultados.
            </p>
          </div>

          <div className="premium-card p-6 bg-primary/5 border-primary/10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
              Informações da Conta
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Role</span>
                <span className="px-2 py-0.5 rounded bg-primary text-white">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">ID do Tenant</span>
                <span className="text-foreground truncate max-w-[120px]">
                  {user?.tenantId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
