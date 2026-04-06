"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { AuthResponse } from "@/types/auth";

type Role = "ORGANIZER" | "PARTICIPANT";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PARTICIPANT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = role === "ORGANIZER"
        ? await authService.registerOrganizer({
            name,
            email,
            password,
            tenantName,
            tenantSlug,
          })
        : await authService.registerParticipant({
            name,
            email,
            password,
          });
      
      login(response);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Falha ao criar conta. Tente novamente.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
          {/* Role Toggle */}
          <div className="flex p-1 bg-muted rounded-2xl">
            <button
              onClick={() => setRole("PARTICIPANT")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                role === "PARTICIPANT"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou Participante
            </button>
            <button
              onClick={() => setRole("ORGANIZER")}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                role === "ORGANIZER"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou Organizador
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-foreground ml-1" htmlFor="name">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground ml-1" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
              />
            </div>

            {role === "ORGANIZER" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1" htmlFor="tenantName">
                    Nome da Organização
                  </label>
                  <input
                    id="tenantName"
                    type="text"
                    required
                    placeholder="Ex: Tech Events Ltd"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1" htmlFor="tenantSlug">
                    Slug da Organização
                  </label>
                  <div className="relative">
                    <input
                      id="tenantSlug"
                      type="text"
                      required
                      placeholder="tech-events"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                      URL Única
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="premium-button w-full !py-4 text-lg font-black shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all col-span-2 mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando Conta...
                </div>
              ) : (
                "Finalizar Cadastro"
              )}
            </button>
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
