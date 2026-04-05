"use client";

import { useEffect, useState } from "react";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";
import { 
  PlusIcon, 
  EllipsisVerticalIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsService.getOrganizerEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch organizer events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.location || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Meus Eventos</h1>
          <p className="text-muted-foreground font-medium mt-1">Gerencie e acompanhe o desempenho de seus eventos.</p>
        </div>
        <Link 
          href="/dashboard/events/new"
          className="premium-button !px-6 !py-3 !text-sm !font-black inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Criar Novo Evento
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar eventos por nome ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input w-full pl-12 pr-4"
          />
        </div>
        <div className="flex gap-2">
          <select className="h-12 px-4 rounded-xl border border-border bg-card text-sm font-bold focus:border-primary outline-none cursor-pointer">
            <option>Todos os Status</option>
            <option>Ativos</option>
            <option>Rascunhos</option>
            <option>Encerrados</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="premium-card bg-card border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {event.bannerUrl ? (
                  <Image 
                    src={event.bannerUrl} 
                    alt={event.name} 
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-primary">
                    <CalendarIcon className="w-12 h-12 opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg ${
                    event.status === 'PUBLISHED' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                  }`}>
                    {event.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{event.name}</h3>
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    {new Date(event.startDate).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <MapPinIcon className="w-4 h-4 text-primary" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="text-foreground font-black">{event._count?.registrations ?? 0}</span> Inscritos
                  </div>
                  <Link 
                    href={`/dashboard/events/${event.id}`}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Gerenciar →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card p-12 bg-card border-border border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Você ainda não criou nenhum evento ou sua busca não retornou resultados.
            </p>
          </div>
          <Link href="/dashboard/events/new" className="premium-button !px-8">
            Começar meu Primeiro Evento
          </Link>
        </div>
      )}
    </div>
  );
}
