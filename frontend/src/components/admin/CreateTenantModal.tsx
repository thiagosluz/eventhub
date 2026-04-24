"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  HomeModernIcon,
  UserIcon,
  KeyIcon,
  EnvelopeIcon,
  LinkIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Modal } from "@/components/ui";
import {
  adminCreateTenantSchema,
  type AdminCreateTenantInput,
} from "@/lib/validation/admin";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateTenantInput>({
    resolver: zodResolver(adminCreateTenantSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      slug: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (values: AdminCreateTenantInput) => {
    setSubmitError(null);
    try {
      await api.post("/admin/tenants", values);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        (err as Error)?.message || "Erro ao criar inquilino.",
      );
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="xl">
      <Modal.Header
        icon={<HomeModernIcon className="w-5 h-5" />}
        iconTone="primary"
      >
        <div>
          <div className="text-xl font-black tracking-tight">Novo Inquilino</div>
          <p className="text-sm font-medium text-muted-foreground">
            Cadastre uma nova organização na plataforma.
          </p>
        </div>
      </Modal.Header>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body className="space-y-6">
          {submitError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold"
            >
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">
              <HomeModernIcon className="w-4 h-4" />
              Dados da Organização
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="tenant-name"
                label="Nome Fantasia"
                required
                placeholder="Ex: Eventos Pro"
                leftAddon={<HomeModernIcon className="w-4 h-4" />}
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                id="tenant-slug"
                label="Slug da URL"
                required
                placeholder="ex-eventos-pro"
                leftAddon={<LinkIcon className="w-4 h-4" />}
                error={errors.slug?.message}
                {...register("slug")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary border-b border-border pb-2">
              <UserIcon className="w-4 h-4" />
              Administrador Mestre
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="admin-name"
                label="Nome Completo"
                required
                placeholder="Nome do responsável"
                leftAddon={<UserIcon className="w-4 h-4" />}
                error={errors.adminName?.message}
                {...register("adminName")}
              />
              <Input
                id="admin-email"
                type="email"
                label="E-mail Principal"
                required
                placeholder="email@exemplo.com"
                leftAddon={<EnvelopeIcon className="w-4 h-4" />}
                error={errors.adminEmail?.message}
                {...register("adminEmail")}
              />
              <div className="md:col-span-2">
                <Input
                  id="admin-password"
                  type="password"
                  label="Senha de Acesso"
                  required
                  placeholder="••••••••"
                  leftAddon={<KeyIcon className="w-4 h-4" />}
                  error={errors.adminPassword?.message}
                  {...register("adminPassword")}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<RocketLaunchIcon className="w-5 h-5" />}
          >
            Finalizar Provisionamento
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
