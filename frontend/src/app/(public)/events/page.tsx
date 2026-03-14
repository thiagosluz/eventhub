import { eventsService } from "@/services/events.service";
import { EventCard } from "@/components/events/EventCard";
import { Event } from "@/types/event";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let events: Event[] = [];
  let error = null;

  try {
    events = await eventsService.getPublicEvents();
  } catch (e) {
    console.error("Failed to fetch events:", e);
    error = "Não foi possível carregar os eventos no momento. Tente novamente mais tarde.";
  }

  return (
    <main className="min-h-screen pt-40 pb-24 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Explorar <span className="text-primary">Eventos</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Encontre congressos, workshops e conferências de alto nível organizados na nossa plataforma.
            </p>
          </div>
          
          {/* Search Placeholder */}
          <div className="w-full md:w-96">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Buscar eventos..." 
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {error ? (
          <div className="premium-card p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="premium-card p-24 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/5 text-primary/40 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground">Não existem eventos publicados no momento. Volte em breve!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
