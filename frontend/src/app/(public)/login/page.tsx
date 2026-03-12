"use client";

import { getApiUrl, setToken } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "E-mail ou senha inválidos.");
        return;
      }
      const { token } = await res.json();
      setToken(token);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando e se NEXT_PUBLIC_API_URL no .env.local está correto (ex.: http://localhost:3000)."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container max-w-md mx-auto px-4 py-12" aria-label="Entrar">
      <h1 className="text-2xl font-bold text-foreground mb-6">Entrar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href={`/cadastro${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="container py-12 text-muted-foreground">Carregando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
