"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Event } from "@/types/event";

interface TicketWidgetProps {
  event: Event;
}

export function TicketWidget({ event }: TicketWidgetProps) {
  const router = useRouter();

  const handleCheckout = () => {
    const params = new URLSearchParams();
    params.set("eventId", event.id);
    params.set("slug", event.slug);
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="premium-card p-8 sticky top-32 space-y-6 bg-primary/5 border-primary/20">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Inscrições</h3>
        <p className="text-sm text-muted-foreground font-medium">Selecione seu ingresso e atividades.</p>
      </div>

      <div className="space-y-4">
        {/* Ticket Selector (Simplificado para 1 opção por enquanto) */}
        <div className="p-4 rounded-xl bg-background border-2 border-primary space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold">Ingresso Geral</span>
            <span className="text-primary font-black">Grátis</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Acesso total ao evento e atividades automáticas.</p>
        </div>

        <button 
          onClick={handleCheckout}
          className="premium-button w-full !py-4 text-lg font-black shadow-lg shadow-primary/20 mt-4"
        >
          Fazer Inscrição
        </button>

        <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest">
          🔒 Inscrição Segura via EventHub
        </p>
      </div>

      <div className="pt-6 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-primary overflow-hidden">
            {event.logoUrl ? (
              <Image 
                src={event.logoUrl} 
                alt={event.tenant?.name || "Logo"} 
                width={48}
                height={48}
                className="w-full h-full object-cover" 
              />
            ) : (
              event.tenant?.name?.[0].toUpperCase() || 'E'
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">Organizado por</p>
            <p className="font-bold text-foreground line-clamp-1">{event.tenant?.name || 'Organizador EventHub'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
