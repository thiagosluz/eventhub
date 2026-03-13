"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, MapPin, Share2, Ticket, Users, Clock, ArrowRight, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PublicEvent {
  id: string
  name: string
  slug: string
  description?: string
  location?: string
  startDate: string
  endDate: string
  bannerUrl?: string
  logoUrl?: string
  themeConfig?: { color?: string }
  activities: {
    id: string
    title: string
    description?: string
    startAt: string
    endAt: string
  }[]
  tenant: {
    name: string
  }
}

export default function EventDetailsPage() {
  const { slug } = useParams()

  const { data: event, isLoading, error } = useQuery<PublicEvent>({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data } = await api.get(`/public/events/${slug}`)
      return data
    },
    retry: 1
  })

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando detalhes do evento...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/20 pb-20">
        <h1 className="text-3xl font-bold mb-2">Evento não encontrado</h1>
        <p className="text-muted-foreground mb-6">O evento que você procura não existe ou não está mais disponível.</p>
        <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">Voltar para a Home</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Event Header Banner */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop"} 
          alt={event.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 w-full">
          <div className="container mx-auto px-4 pb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl flex items-end gap-6"
            >
              {event.logoUrl && (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-2 shadow-xl border mb-4 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div>
                <div className="flex gap-2 mb-4">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md uppercase tracking-wider">Evento Especial</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
                  {event.name}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  {format(new Date(event.startDate), "dd 'de' MMMM", { locale: ptBR })} - {format(new Date(event.endDate), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            {event.description && (
              <section className="bg-card p-8 rounded-3xl border border-border shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Sobre o Evento</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold mb-6">Informações</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg mb-1">Data e Hora</div>
                    <div className="text-muted-foreground">
                      Início: {format(new Date(event.startDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}<br />
                      Fim: {format(new Date(event.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                {event.location && (
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg mb-1">Localização</div>
                      <div className="text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {event.activities && event.activities.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Programação (Grade)</h2>
                <div className="space-y-4">
                  {event.activities.map((activity, i) => (
                    <div key={activity.id} className="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row gap-6 hover:border-primary/50 transition-colors">
                      <div className="sm:w-32 flex-shrink-0 text-center sm:text-left">
                        <div className="font-bold text-lg">{format(new Date(activity.startAt), "HH:mm")}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
                          <Clock className="w-3 h-3" /> {format(new Date(activity.endAt), "HH:mm")}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">{activity.title}</h3>
                        {activity.description && (
                          <p className="text-muted-foreground mb-4">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Ticket Box */}
          <div className="relative">
            <div className="sticky top-24 bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">A partir de</div>
                    <div className="text-4xl font-extrabold">Grátis*</div>
                  </div>
                  <button className="p-2 border border-border rounded-full hover:bg-muted text-muted-foreground transition-colors" aria-label="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span>Inscrição Rápida e Fácil</span>
                  </div>
                </div>

                <Link 
                  href={`/checkout/${event.slug}`}
                  className="flex w-full h-14 items-center justify-center rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95 hover:bg-primary/90"
                >
                  Garantir Ingresso
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                
                <p className="text-center text-xs text-muted-foreground mt-4">Transação 100% segura. Vagas limitadas.</p>
              </div>
              
              {/* Se a API trouxesse o Tenant, exibiríamos aqui */}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
