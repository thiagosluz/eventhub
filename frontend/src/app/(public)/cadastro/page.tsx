"use client";

import { getApiUrl, setToken } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/register-organizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName: tenantName.trim() || "Minha organização",
          tenantSlug: tenantSlug.trim() || email.split("@")[0].toLowerCase().replace(/\W/g, "-"),
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Erro ao criar conta.");
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
    <section className="container max-w-md mx-auto px-4 py-12" aria-label="Criar conta">
      <h1 className="text-2xl font-bold text-foreground mb-6">Criar conta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cadastro-name" className="block text-sm font-medium text-foreground mb-1">
            Nome
          </label>
          <input
            id="cadastro-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="cadastro-email" className="block text-sm font-medium text-foreground mb-1">
            E-mail
          </label>
          <input
            id="cadastro-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="cadastro-password" className="block text-sm font-medium text-foreground mb-1">
            Senha
          </label>
          <input
            id="cadastro-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="cadastro-tenant" className="block text-sm font-medium text-foreground mb-1">
            Nome da organização (opcional)
          </label>
          <input
            id="cadastro-tenant"
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Minha organização"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="cadastro-slug" className="block text-sm font-medium text-foreground mb-1">
            Identificador da organização (opcional)
          </label>
          <input
            id="cadastro-slug"
            type="text"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="minha-organizacao"
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
          {loading ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<p className="container py-12 text-muted-foreground">Carregando…</p>}>
      <CadastroForm />
    </Suspense>
  );
}
