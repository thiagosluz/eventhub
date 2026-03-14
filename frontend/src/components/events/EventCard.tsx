import Link from "next/link";
import { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = new Date(event.startDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).toUpperCase();

  return (
    <Link href={`/events/${event.slug}`} className="group premium-card overflow-hidden block">
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        {event.bannerUrl ? (
          <img 
            src={event.bannerUrl} 
            alt={event.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-500/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-lg text-sm font-black text-primary border border-primary/10 shadow-lg">
          {formattedDate}
        </div>
      </div>
      <div className="p-8 space-y-4">
        <div className="text-xs font-bold text-primary uppercase tracking-widest">
          {event.tenant?.name || 'Evento'}
        </div>
        <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[4rem]">
          {event.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {event.location || 'Online'}
        </div>
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            {event.tickets && event.tickets.length > 0 
              ? `A partir de R$ ${Math.min(...event.tickets.map(t => t.price))}`
              : 'Ver Detalhes'}
          </span>
          <div className="text-sm font-extrabold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            Garantir Vaga <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={2.5} /></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
