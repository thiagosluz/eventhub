"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Check, CreditCard, Ticket as TicketIcon, Loader2, AlertCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface PublicEvent {
  id: string
  name: string
  slug: string
  bannerUrl?: string
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const { slug } = useParams()
  const router = useRouter()
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  
  const [success, setSuccess] = useState(false)

  const { data: event, isLoading: eventLoading } = useQuery<PublicEvent>({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data } = await api.get(`/public/events/${slug}`)
      return data
    },
    enabled: !!slug
  })

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/checkout", {
        eventId: event?.id,
        activityIds: [], // Placeholder for future activities selection
        formResponses: []
      })
      return response.data
    },
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => {
        router.push("/meus-ingressos")
      }, 3000)
    }
  })

  // Prevent accessing checkout if not logged in (after auth finishes loading)
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Autenticação Necessária</h2>
        <p className="text-muted-foreground mb-6">Você precisa estar logado para garantir seu ingresso.</p>
        <Link href={`/login`} className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md">
          Fazer Login ou Cadastrar
        </Link>
      </div>
    )
  }

  if (eventLoading || authLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparando checkout...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/20 pb-20">
        <h1 className="text-3xl font-bold mb-2">Evento não encontrado</h1>
        <p className="text-muted-foreground mb-6">Não foi possível carregar os detalhes do evento.</p>
        <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">Voltar para a Home</Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card p-8 rounded-3xl border border-border shadow-lg flex flex-col items-center text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Inscrição Confirmada!</h2>
          <p className="text-muted-foreground mb-8">
            Seu ingresso para o <strong>{event.name}</strong> foi garantido com sucesso.
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Redirecionando para o seu dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href={`/evento/${event.slug}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o evento
        </Link>

        {/* Checkout Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Finalizar Inscrição</h1>
          <p className="text-muted-foreground">{event.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Ingressos */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-2xl border ${step === 1 ? 'border-primary ring-1 ring-primary' : 'border-border'} shadow-sm overflow-hidden`}
            >
              <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
                  Seleção de Ingressos
                </h2>
                {step > 1 && <button onClick={() => setStep(1)} className="text-sm text-primary font-medium">Editar</button>}
              </div>
              
              {step === 1 && (
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background hover:border-primary/50 transition-colors cursor-pointer ring-1 ring-primary border-primary">
                      <div>
                        <div className="font-semibold text-lg">Inscrição Padrão</div>
                        <div className="text-sm text-muted-foreground">Acesso ao evento.</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">Grátis*</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setStep(2)}
                      className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Step 2: Informações do Participante */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-2xl border ${step === 2 ? 'border-primary ring-1 ring-primary' : 'border-border'} shadow-sm overflow-hidden`}
            >
              <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
                  Dados do Participante
                </h2>
                {step > 2 && <button onClick={() => setStep(2)} className="text-sm text-primary font-medium">Editar</button>}
              </div>

              {step === 2 && (
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo</label>
                    <input type="text" className="w-full h-10 px-3 rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed" value={user?.name || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail (Para receber o ingresso)</label>
                    <input type="email" className="w-full h-10 px-3 rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed" value={user?.email || ""} disabled />
                  </div>
                  <p className="text-xs text-muted-foreground">Estes são os dados da sua conta EventHub.</p>
                  
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setStep(1)} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">Voltar</button>
                    <button 
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Ir para Confirmação
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Step 3: Pagamento */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-2xl border ${step === 3 ? 'border-primary ring-1 ring-primary' : 'border-border'} shadow-sm overflow-hidden`}
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</span>
                  Confirmação
                </h2>
              </div>

              {step === 3 && (
                <div className="p-6 space-y-6">
                  
                  <div className="bg-green-500/10 text-green-700 p-4 rounded-xl border border-green-500/20 text-sm">
                    Este evento possui inscrição gratuita. Nenhuma cobrança será realizada no seu cartão.
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <button onClick={() => setStep(2)} className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors" disabled={checkoutMutation.isPending}>Voltar</button>
                    <button 
                      onClick={() => checkoutMutation.mutate()}
                      disabled={checkoutMutation.isPending}
                      className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {checkoutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      Confirmar Inscrição
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=100&auto=format&fit=crop"} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-medium leading-tight mb-1">{event.name}</h4>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <TicketIcon className="w-3 h-3" />
                      1x Inscrição Padrão
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de Serviço</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-extrabold text-2xl text-primary">Grátis*</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
