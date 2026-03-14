"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Event, Activity } from "@/types/event";
import { CheckCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface TicketWidgetProps {
  event: Event;
}

export function TicketWidget({ event }: TicketWidgetProps) {
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const router = useRouter();

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckout = () => {
    const params = new URLSearchParams();
    params.set("eventId", event.id);
    params.set("slug", event.slug);
    if (selectedActivities.length > 0) {
      params.set("activityIds", selectedActivities.join(","));
    }
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
          <p className="text-xs text-muted-foreground font-medium">Acesso a todas as palestras e workshops.</p>
        </div>

        {/* Activity Selection */}
        {event.activities && event.activities.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
              Atividades Extras
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {event.activities.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    selectedActivities.includes(activity.id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    selectedActivities.includes(activity.id)
                      ? "bg-primary border-primary text-white"
                      : "border-border"
                  }`}>
                    {selectedActivities.includes(activity.id) && <CheckCircleIcon className="w-3 h-3" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground line-clamp-1">{activity.title}</p>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(activity.startAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <img src={event.logoUrl} alt={event.tenant?.name} className="w-full h-full object-cover" />
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
