"use client";

import { useEffect, useState } from "react";
import { usersService, EventMonitored } from "@/services/users.service";
import Link from "next/link";
import Image from "next/image";
import { TicketIcon, QrCodeIcon } from "@heroicons/react/24/outline";

export default function MonitorEventsPage() {
  const [monitoredEvents, setMonitoredEvents] = useState<EventMonitored[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    usersService.getMonitoredEvents()
      .then((data) => setMonitoredEvents(data))
      .catch((err) => console.error("Failed to load monitored events:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-foreground">Eventos Monitorados</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Acesse a área de operações dos eventos nos quais você foi designado como equipe de apoio.
        </p>
      </div>

      {monitoredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monitoredEvents.map(({ event }) => (
            <div key={event.id} className="premium-card bg-card border-border overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="h-32 bg-slate-200 relative overflow-hidden">
                {event.bannerUrl ? (
                  <Image 
                    src={event.bannerUrl} 
                    alt={event.name} 
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                    <TicketIcon className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded-md">
                  {event.status === 'PUBLISHED' ? 'Ativo' : event.status}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground line-clamp-1">{event.name}</h3>
                  <div className="flex gap-4 mt-2 mb-6">
                    <div className="text-xs font-bold text-muted-foreground">
                      Inicio: <span className="text-foreground">{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/monitor/events/${event.id}/checkin`}
                  className="premium-button w-full text-center text-xs justify-center gap-2"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  Acessar Check-in
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card p-12 text-center text-muted-foreground bg-white border-dashed">
          <QrCodeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-black text-foreground">Nenhum evento</h2>
          <p className="text-sm font-medium mt-2">Você não está designado como monitor em nenhum evento no momento.</p>
        </div>
      )}
    </div>
  );
}
