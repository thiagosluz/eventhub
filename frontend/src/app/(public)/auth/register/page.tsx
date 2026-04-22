"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { Button, Input } from "@/components/ui";
import {
  registerOrganizerSchema,
  registerParticipantSchema,
  type RegisterOrganizerInput,
  type RegisterParticipantInput,
} from "@/lib/validation/auth";

type Role = "ORGANIZER" | "PARTICIPANT";

type FormValues = RegisterOrganizerInput & Partial<RegisterParticipantInput>;

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PARTICIPANT");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(
      role === "ORGANIZER" ? registerOrganizerSchema : registerParticipantSchema,
    ) as never,
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      tenantName: "",
      tenantSlug: "",
    },
  });

  const handleRoleChange = (next: Role) => {
    setRole(next);
    setSubmitError(null);
    reset(undefined, { keepValues: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const response =
        role === "ORGANIZER"
          ? await authService.registerOrganizer({
              name: values.name,
              email: values.email,
              password: values.password,
              tenantName: values.tenantName!,
              tenantSlug: values.tenantSlug!,
            })
          : await authService.registerParticipant({
              name: values.name,
              email: values.email,
              password: values.password,
            });

      login(response);
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Falha ao criar conta. Tente novamente.";
      setSubmitError(message);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground">
              Event<span className="text-primary">Hub</span>
            </span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Criar sua conta</h1>
          <p className="text-muted-foreground font-medium">
            Junte-se a nós e comece a gerenciar ou participar de eventos incríveis.
          </p>
        </div>

        <div className="premium-card p-10 space-y-8 bg-card border-border shadow-2xl">
          <div
            role="tablist"
            aria-label="Tipo de conta"
            className="flex p-1 bg-muted rounded-2xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === "PARTICIPANT"}
              onClick={() => handleRoleChange("PARTICIPANT")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                role === "PARTICIPANT"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou Participante
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "ORGANIZER"}
              onClick={() => handleRoleChange("ORGANIZER")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                role === "ORGANIZER"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou Organizador
            </button>
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium"
            >
              {submitError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            noValidate
          >
            <div className="md:col-span-2">
              <Input
                id="name"
                type="text"
                label="Nome Completo"
                placeholder="Ex: João Silva"
                autoComplete="name"
                required
                error={errors.name?.message}
                {...register("name")}
              />
            </div>

            <Input
              id="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              helperText="Mínimo de 8 caracteres"
              error={errors.password?.message}
              {...register("password")}
            />

            {role === "ORGANIZER" && (
              <>
                <Input
                  id="tenantName"
                  type="text"
                  label="Nome da Organização"
                  placeholder="Ex: Tech Events Ltd"
                  required
                  error={errors.tenantName?.message}
                  {...register("tenantName")}
                />

                <Input
                  id="tenantSlug"
                  type="text"
                  label="Slug da Organização"
                  placeholder="tech-events"
                  required
                  helperText="Apenas minúsculas, números e hífens"
                  error={errors.tenantSlug?.message}
                  {...register("tenantSlug", {
                    onChange: (e) =>
                      setValue(
                        "tenantSlug",
                        e.target.value.toLowerCase().replace(/\s+/g, "-"),
                        { shouldValidate: false },
                      ),
                  })}
                />
              </>
            )}

            <div className="md:col-span-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Criando Conta..." : "Finalizar Cadastro"}
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Entre agora
          </Link>
        </p>
      </div>
    </main>
  );
}
