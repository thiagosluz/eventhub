"use client";

import { useEffect, useState } from "react";
import { eventsService } from "@/services/events.service";
import { Ticket } from "@/types/event";
import { 
  QrCodeIcon, 
  CalendarIcon, 
  MapPinIcon, 
  ChevronRightIcon,
  TicketIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { CertificatesList } from "@/components/certificates/CertificatesList";

function QRCodeImage({ ticketId }: { ticketId: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        // Fetch as blob since it's protected by JWT
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/tickets/${ticketId}/qrcode`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eventhub_token')}`
          }
        });
        const blob = await response.blob();
        setQrUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to fetch QR Code", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [ticketId]);

  if (loading) return <div className="w-48 h-48 bg-muted animate-pulse rounded-xl" />;
  if (!qrUrl) return <div className="w-48 h-48 bg-destructive/10 flex items-center justify-center text-destructive rounded-xl text-[10px] font-bold">Erro ao carregar QR</div>;

  return <img src={qrUrl} alt="Ticket QR Code" className="w-48 h-48 rounded-xl shadow-inner bg-white p-2" />;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'certificates'>('tickets');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await eventsService.getMyTickets();
        setTickets(data);
      } catch (error) {
        console.error("Failed to fetch tickets", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Meus Ingressos</h1>
          <p className="text-muted-foreground font-medium">Acesse seus acessos e credenciais para os eventos.</p>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'tickets' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <TicketIcon className="w-4 h-4" />
            Ingressos
            {activeTab === 'tickets' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />}
          </button>
          <button 
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'certificates' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <AcademicCapIcon className="w-4 h-4" />
            Certificados
            {activeTab === 'certificates' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left-2" />}
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {activeTab === 'tickets' ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="premium-card overflow-hidden bg-card border-border flex flex-col md:flex-row group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              {/* Event Image Side */}
              <div className="w-full md:w-48 aspect-video md:aspect-auto relative overflow-hidden bg-muted flex-shrink-0">
                {ticket.event?.bannerUrl ? (
                  <img src={ticket.event.bannerUrl} alt={ticket.event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <TicketIcon className="w-12 h-12 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
              </div>

              {/* Content Side */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{ticket.event?.name}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{ticket.type}</span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      {ticket.event?.startDate ? new Date(ticket.event.startDate).toLocaleDateString() : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <MapPinIcon className="w-4 h-4 text-primary" />
                      <span className="line-clamp-1">{ticket.event?.location || 'Virtual'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1 premium-button !py-3 !text-xs !font-black flex items-center justify-center gap-2"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    Ver QR Code
                  </button>
                  <Link 
                    href={`/events/${ticket.event?.slug}`}
                    className="p-3 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
                    title="Ver página do evento"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
            ) : (
              <div className="premium-card p-16 text-center space-y-6">
                 <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto">
                   <TicketIcon className="w-10 h-10 text-muted-foreground" />
                 </div>
                 <div className="space-y-2">
                   <h2 className="text-2xl font-black text-foreground">Nenhum ingresso encontrado</h2>
                   <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm">Parece que você ainda não se inscreveu em nenhum evento. Explore nosso catálogo e encontre algo bacana!</p>
                 </div>
                 <Link href="/events" className="premium-button !inline-flex !px-10">Explorar Eventos</Link>
              </div>
            )}
          </>
        ) : (
          <CertificatesList />
        )}
      </div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)} />
           <div className="premium-card bg-card border-border w-full max-w-sm p-8 space-y-8 relative z-10 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-foreground">{selectedTicket.event?.name}</h3>
                 <p className="text-xs font-black uppercase tracking-widest text-primary italic">Apresente este código no check-in</p>
              </div>

              <div className="flex justify-center">
                 <QRCodeImage ticketId={selectedTicket.id} />
              </div>

              <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID do Ingresso</p>
                    <p className="text-xs font-mono font-bold break-all">{selectedTicket.id}</p>
                 </div>
                 <button 
                   onClick={() => setSelectedTicket(null)}
                   className="w-full py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                 >
                   Fechar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
