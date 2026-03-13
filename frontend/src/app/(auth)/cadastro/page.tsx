"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, User, Building, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

export default function RegisterPage() {
  const [role, setRole] = useState<"PARTICIPANT" | "ORGANIZER">("PARTICIPANT")
  const router = useRouter()
  const { signIn } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tenantName, setTenantName] = useState("")
  
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let response;
      if (role === "ORGANIZER") {
        const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        response = await api.post("/auth/register-organizer", {
          name,
          email,
          password,
          tenantName,
          tenantSlug: slug
        })
      } else {
        response = await api.post("/auth/register-participant", {
          name,
          email,
          password,
        })
      }
      
      const { token } = response.data
      signIn(token)
      
      if (role === "ORGANIZER") {
        router.push("/admin")
      } else {
        router.push("/meus-ingressos")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]"
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Crie sua conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Junte-se a milhares de pessoas no EventHub
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="flex p-1 bg-muted rounded-lg">
          <button
            onClick={() => setRole("PARTICIPANT")}
            type="button"
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              role === "PARTICIPANT" 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Participante
          </button>
          <button
            onClick={() => setRole("ORGANIZER")}
            type="button"
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
              role === "ORGANIZER" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
            }`}
          >
            <Building className="w-4 h-4 mr-2" />
            Organizador
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center">
                {error}
              </div>
            )}

            {role === "ORGANIZER" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid gap-2">
                <label className="text-sm font-medium leading-none" htmlFor="tenantName">
                  Nome da Organização/Empresa
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="tenantName"
                    placeholder="Sua Produtora"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                    required={role === "ORGANIZER"}
                  />
                </div>
              </motion.div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none" htmlFor="name">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="name"
                  placeholder="Seu nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  placeholder="nome@exemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-primary/50"
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 active:scale-[0.98] shadow-md shadow-primary/20"
              type="submit"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta Grátis"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>
        </form>

      </div>
      
      <div className="text-center mt-6">
        <span className="text-sm text-muted-foreground mr-1">Já tem uma conta?</span>
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
          Acessar plataforma
        </Link>
      </div>
    </motion.div>
  )
}
