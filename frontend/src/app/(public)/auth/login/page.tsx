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

const DEV_LOGIN_PRESETS = [
  {
    label: "Super Admin",
    email: "superadmin@eventhub.com.br",
    password: "123456",
  },
  {
    label: "Admin",
    email: "admin@eventhub.com.br",
    password: "123456",
  },
  {
    label: "Organizador",
    email: "organizador@eventhub.com.br",
    password: "123456",
  },
  {
    label: "Participante",
    email: "participante@eventhub.com.br",
    password: "123456",
  },
  {
    label: "Revisor",
    email: "revisor@eventhub.com.br",
    password: "123456",
  },
] as const;

export default function LoginPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requires2fa, setRequires2fa] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const reason = searchParams.get("reason");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });
  const isQuickLoginEnabled = process.env.NODE_ENV !== "production";

  const onSubmit = async (values: LoginInput) => {
    setSubmitError(null);
    try {
      const response = await authService.login(values);
      
      if (response.requires2fa && response.tempToken) {
        setRequires2fa(true);
        setTempToken(response.tempToken);
        return;
      }
      
      if (response.access_token && response.refresh_token && response.user) {
        login(response as import('@/types/auth').AuthResponse);
        if (redirectTo && redirectTo.startsWith("/")) {
          router.push(redirectTo);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Falha ao entrar. Verifique suas credenciais.";
      setSubmitError(message);
    }
  };

  const onTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const isValidLength = isRecoveryMode ? twoFactorCode.length >= 8 : twoFactorCode.length === 6;
    if (!tempToken || !isValidLength) {
      setSubmitError(isRecoveryMode ? "Digite o código de backup completo." : "Digite o código de 6 dígitos.");
      return;
    }

    try {
      const response = await authService.authenticate2fa(twoFactorCode, tempToken);
      login(response);
      if (redirectTo && redirectTo.startsWith("/")) {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Código inválido.";
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
          {isQuickLoginEnabled && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Acesso rápido (teste)
              </p>
              <div className="flex flex-wrap gap-2">
                {DEV_LOGIN_PRESETS.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => {
                      setValue("email", preset.email, { shouldDirty: true });
                      setValue("password", preset.password, { shouldDirty: true });
                      setSubmitError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Preenche automaticamente as credenciais do seed para agilizar testes.
              </p>
            </div>
          )}

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

          {requires2fa ? (
            <form onSubmit={onTwoFactorSubmit} className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-foreground">
                  {isRecoveryMode ? "Código de Recuperação" : "Autenticação em Duas Etapas"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRecoveryMode 
                    ? "Digite um dos seus códigos de backup de 10 caracteres." 
                    : "Abra o Google Authenticator ou Authy e digite o código gerado."}
                </p>
              </div>
              <Input
                id="twoFactorCode"
                type="text"
                label={isRecoveryMode ? "Código de Backup" : "Código de Autenticação"}
                placeholder={isRecoveryMode ? "A1B2C3D4E5" : "123456"}
                autoComplete="one-time-code"
                required
                maxLength={isRecoveryMode ? 10 : 6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(isRecoveryMode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest h-14"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isRecoveryMode ? twoFactorCode.length < 8 : twoFactorCode.length !== 6}
              >
                Verificar Código
              </Button>
              
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setIsRecoveryMode(!isRecoveryMode);
                    setTwoFactorCode("");
                  }}
                >
                  {isRecoveryMode ? "Usar App de Autenticação" : "Usar código de recuperação"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setRequires2fa(false);
                    setTempToken(null);
                    setTwoFactorCode("");
                    setIsRecoveryMode(false);
                  }}
                >
                  Voltar
                </Button>
              </div>
            </form>
          ) : (
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
          )}
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
