"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { Button, Input } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const reason = searchParams.get("reason");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setSubmitError(null);
    try {
      const response = await authService.login(values);
      login(response);
      if (redirectTo && redirectTo.startsWith("/")) {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Falha ao entrar. Verifique suas credenciais.";
      setSubmitError(message);
    }
  };

  const inlineReason =
    reason === "expired"
      ? "Sua sessão expirou. Entre novamente."
      : reason === "unauthenticated"
        ? "Faça login para continuar."
        : reason === "invalid"
          ? "Sessão inválida. Entre novamente."
          : null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
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
          <h1 className="text-3xl font-black tracking-tight">Bem-vindo de volta</h1>
          <p className="text-muted-foreground font-medium">
            Entre na sua conta para gerenciar seus eventos.
          </p>
        </div>

        <div className="premium-card p-8 space-y-6 bg-card border-border shadow-2xl">
          {inlineReason && (
            <div
              role="status"
              className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
            >
              {inlineReason}
            </div>
          )}
          {submitError && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium"
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground" htmlFor="password">
                  Senha <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar na Conta"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </main>
  );
}
