"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Plus, MoreHorizontal, MapPin, Users, Ticket, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Event {
  id: string
  name: string
  slug: string
  location?: string
  startDate: string
  endDate: string
  status: string
  bannerUrl?: string
}

export default function AdminEventsListPage() {
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await api.get("/events")
      return data
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Eventos</h1>
          <p className="text-muted-foreground">Gerencie seus eventos, edite detalhes e crie novos.</p>
        </div>
        <Link href="/admin/eventos/novo" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Link>
      </div>

      <div className="grid gap-4 mt-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-center">
            Erro ao carregar eventos. Tente novamente mais tarde.
          </div>
        )}

        {events?.length === 0 && (
          <div className="text-center py-12 bg-muted/30 border border-border border-dashed rounded-xl">
             <p className="text-muted-foreground mb-4">Você ainda não criou nenhum evento.</p>
             <Link href="/admin/eventos/novo" className="inline-flex items-center text-primary font-medium hover:underline">
               Criar meu primeiro evento
             </Link>
          </div>
        )}

        {events?.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="w-full sm:w-32 h-32 rounded-lg shrink-0 overflow-hidden bg-muted flex flex-col items-center justify-center text-muted-foreground border border-border">
              {event.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs uppercase font-bold tracking-wider">Sem Imagem</span>
              )}
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> 
                      {format(new Date(event.startDate), "dd MMM, yyyy", { locale: ptBR })}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
                    )}
                  </div>
                </div>
                <div>
                  {event.status === "PUBLISHED" ? (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">Publicado</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">Rascunho</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border mt-4 text-sm mt-auto">
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1"><Ticket className="h-3 w-3" /> Vendidos</div>
                  <div className="font-semibold">-</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Receita</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">-</div>
                </div>
                <div className="flex items-center justify-end">
                  <Link href={`/admin/eventos/${event.slug}`} className="text-primary font-medium hover:underline text-sm">
                    Painel do Evento
                  </Link>
                  <button className="ml-4 p-2 rounded-md hover:bg-muted text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
