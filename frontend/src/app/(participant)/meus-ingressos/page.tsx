"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Calendar, Clock, Download, ExternalLink, Loader2, Ticket as TicketIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Ticket {
  id: string
  qrCodeToken: string | null
  createdAt: string
  event: {
    name: string
    slug: string
    startDate: string
    endDate: string
    location?: string
    bannerUrl?: string
    logoUrl?: string
  }
}

export default function MeusIngressosPage() {
  const { user } = useAuth()
  
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const { data } = await api.get("/my-tickets")
      return data
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Meus Ingressos</h1>
        <p className="text-muted-foreground">Gerencie suas inscrições e acesse seus QR Codes.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando seus ingressos...</p>
        </div>
      ) : tickets && tickets.length > 0 ? (
        <div className="grid gap-6">
          {tickets.map((ticket, index) => {
            const isPastEvent = new Date(ticket.event.endDate) < new Date()
            
            if (isPastEvent) {
              return (
                <motion.div 
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/50 border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center"
                >
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {ticket.event.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ticket.event.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground font-bold">{ticket.event.name.substring(0, 3).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold mb-1">{ticket.event.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                       Evento concluído em {format(new Date(ticket.event.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">Encerrado</span>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors text-sm">
                      Baixar Certificado
                    </button>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div 
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-primary/30 rounded-3xl overflow-hidden shadow-md flex flex-col lg:flex-row"
              >
                {/* Ticket Info Side */}
                <div className="flex-1 p-6 md:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-border border-dashed relative">
                  <div className="absolute top-0 right-0 w-8 h-8 -mr-4 -mt-4 rounded-full bg-muted/30 hidden lg:block"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 -mr-4 -mb-4 rounded-full bg-muted/30 hidden lg:block"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      Próximo Evento
                    </span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-400">Confirmado</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">{ticket.event.name}</h2>
                  <p className="text-muted-foreground mb-6 line-clamp-2">Inscrição padrão para acessar as áreas livres e a grade geral do evento.</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mt-auto">
                    <div className="flex items-start gap-3">
                      <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase">Data</div>
                        <div className="font-medium text-sm">
                           {format(new Date(ticket.event.startDate), "dd MMM")} a {format(new Date(ticket.event.endDate), "dd MMM, yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase">Horário</div>
                        <div className="font-medium text-sm">Abertura: {format(new Date(ticket.event.startDate), "HH:mm")}</div>
                      </div>
                    </div>
                    {ticket.event.location && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground uppercase">Local</div>
                          <div className="font-medium text-sm">{ticket.event.location}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Side */}
                <div className="lg:w-80 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-card to-muted/30 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full bg-muted/30 hidden lg:block"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 -ml-4 -mb-4 rounded-full bg-muted/30 hidden lg:block"></div>
                  
                  <div className="mb-4 text-center">
                    <div className="font-mono text-sm tracking-widest text-muted-foreground uppercase mb-1">{user?.name}</div>
                    <div className="font-bold text-lg">Inscrição</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50 mb-6 flex items-center justify-center w-48 h-48 overflow-hidden">
                    {ticket.qrCodeToken ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.qrCodeToken}`} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <TicketIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <span className="text-xs font-semibold">Geração em andamento</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground max-w-[200px]">Apresente este código na entrada do evento para credenciamento.</p>
                  
                  <div className="w-full flex gap-2 mt-6">
                    <button className="flex-1 px-4 py-2 border border-border bg-background rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Baixar
                    </button>
                    <Link href={`/evento/${ticket.event.slug}`} className="flex-1 px-4 py-2 border border-border bg-background rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2">
                       Acessar <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border/50 border-dashed text-center px-4">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <TicketIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nenhum ingresso encontrado</h2>
          <p className="text-muted-foreground mb-8 max-w-md">Parece que você ainda não se inscreveu em nenhum evento.</p>
          <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
            Explorar Eventos
          </Link>
        </div>
      )}
    </div>
  )
}
