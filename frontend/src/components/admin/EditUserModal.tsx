"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import {
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Modal } from "@/components/ui";
import {
  adminEditUserSchema,
  type AdminEditUserInput,
} from "@/lib/validation/admin";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: { id: string; name?: string; email?: string; role?: string } | null;
}

const ROLE_OPTIONS: { value: AdminEditUserInput["role"]; label: string }[] = [
  { value: "PARTICIPANT", label: "Participante" },
  { value: "SPEAKER", label: "Palestrante" },
  { value: "REVIEWER", label: "Revisor" },
  { value: "ORGANIZER", label: "Organizador" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminEditUserInput>({
    resolver: zodResolver(adminEditUserSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      role: "PARTICIPANT",
    },
  });

  useEffect(() => {
    if (user) {
      const safeRole = (ROLE_OPTIONS.find((o) => o.value === user.role)?.value ??
        "PARTICIPANT") as AdminEditUserInput["role"];
      reset({
        name: user.name || "",
        email: user.email || "",
        role: safeRole,
      });
    }
    setSubmitError(null);
    setSuccessMsg(null);
  }, [user, reset, isOpen]);

  const onSubmit = async (values: AdminEditUserInput) => {
    if (!user) return;
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      await api.patch(`/admin/users/${user.id}`, values);
      setSuccessMsg("Usuário atualizado com sucesso!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setSubmitError((err as Error)?.message || "Erro ao atualizar usuário.");
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja redefinir a senha deste usuário para o padrão?")) return;

    setResetLoading(true);
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      const res = (await api.post(
        `/admin/users/${user.id}/reset-password`,
      )) as { message: string };
      setSuccessMsg(res.message);
    } catch (err) {
      setSubmitError((err as Error)?.message || "Erro ao redefinir senha.");
    } finally {
      setResetLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <Modal.Header icon={<UserIcon className="w-5 h-5" />} iconTone="primary">
        <div>
          <div className="text-xl font-black tracking-tight">Editar Usuário</div>
          <p className="text-sm font-medium text-muted-foreground">
            Gestão de identidade e segurança.
          </p>
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body className="space-y-5">
          {submitError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold"
            >
              {submitError}
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {successMsg}
            </div>
          )}

          <Input
            id="user-name"
            label="Nome Completo"
            required
            leftAddon={<UserIcon className="w-4 h-4" />}
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            id="user-email"
            type="email"
            label="E-mail"
            required
            leftAddon={<EnvelopeIcon className="w-4 h-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="user-role"
              className="block text-sm font-semibold text-foreground"
            >
              Papel / Nível de Acesso
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <ShieldCheckIcon className="w-4 h-4" />
              </span>
              <select
                id="user-role"
                className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:border-primary focus:ring-primary/15"
                {...register("role")}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.role?.message && (
              <p role="alert" className="text-xs font-medium text-red-500">
                {errors.role.message}
              </p>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResetPassword}
            isLoading={resetLoading}
            leftIcon={<KeyIcon className="w-4 h-4" />}
          >
            Resetar Senha
          </Button>
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Salvar Alterações
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
