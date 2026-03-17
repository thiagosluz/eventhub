import { eventsService } from "@/services/events.service";
import { notFound } from "next/navigation";
import { TicketWidget } from "@/components/events/TicketWidget";
import Link from "next/link";
import Image from "next/image";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event = null;

  try {
    event = await eventsService.getPublicEventBySlug(slug);
  } catch (e) {
    console.error("Failed to fetch event detail:", e);
    return notFound();
  }

  if (!event) return notFound();

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const formattedDate = startDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

  const logoToDisplay = event.logoUrl || event.tenant?.logoUrl;

  return (
    <ThemeProvider themeConfig={event.themeConfig} tenantThemeConfig={event.tenant?.themeConfig}>
      <main className="min-h-screen bg-background pb-24">
        {logoToDisplay && (
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <Link href="/">
               <Image src={logoToDisplay} alt="Logo" width={120} height={32} className="h-8 w-auto object-contain" priority />
             </Link>
          </div>
        )}
      {/* Preview Mode Banner */}
      {event.status === 'DRAFT' && (
        <div className="bg-amber-500 text-white py-2 px-6 flex items-center justify-center gap-3 animate-pulse sticky top-0 z-[60] shadow-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">
            Visualização: Este evento é um rascunho e não está visível para o público.
          </span>
        </div>
      )}

      {/* Event Banner */}
      <div className="relative h-[400px] w-full bg-muted overflow-hidden">
        {event.bannerUrl ? (
          <Image 
            src={event.bannerUrl} 
            alt={event.name} 
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full emerald-gradient opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full px-6 py-12">
          <div className="max-w-7xl mx-auto space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider">
               Evento Confirmado
             </div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
               {event.name}
             </h1>
             <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-semibold">
               <div className="flex items-center gap-2">
                 <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                 </svg>
                 {formattedDate} às {formattedTime}
               </div>
               <div className="flex items-center gap-2">
                 <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 </svg>
                 {event.location || 'Online'}
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-16">
          <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Sobre o Evento</h2>
            <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description || 'Nenhuma descrição fornecida para este evento.'}
            </div>
          </section>

          {/* Activities / Schedule */}
          {event.activities && event.activities.length > 0 && (
            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">Programação</h2>
              <div className="space-y-4">
                {event.activities.map((activity: any) => (
                  <div key={activity.id} className="premium-card p-6 flex items-start gap-6 hover:border-primary/50 transition-colors">
                    <div className="text-center min-w-[80px]">
                      <div className="text-2xl font-black text-primary">
                        {new Date(activity.startAt).getHours().toString().padStart(2, '0')}:
                        {new Date(activity.startAt).getMinutes().toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase">Início</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{activity.title}</h3>
                      <p className="text-muted-foreground line-clamp-2">{activity.description}</p>
                      {activity.location && (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {activity.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar / Ticket Selection */}
        <div className="space-y-8">
          <Link 
            href={`/events/${event.slug}/submit`}
            className="w-full flex items-center justify-between p-6 rounded-3xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all group"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary italic mb-1">Chamada Aberta</span>
              <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors">Submeter Trabalho</span>
            </div>
            <div className="p-3 bg-secondary/20 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
               </svg>
            </div>
          </Link>

          <TicketWidget event={event} />
        </div>
      </div>
    </main>
    </ThemeProvider>
  );
}
