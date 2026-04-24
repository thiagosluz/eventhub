import { Metadata } from 'next';
import { eventsService } from "@/services/events.service";
import { notFound } from "next/navigation";
import { TicketWidget } from "@/components/events/TicketWidget";
import { SponsorShowcase } from "@/components/events/SponsorShowcase";
import { ScheduleGrid } from "@/components/events/ScheduleGrid";
import { SpeakersSection } from "@/components/events/SpeakersSection";
import { SocialShare } from "@/components/events/SocialShare";
import { sponsorsService } from "@/services/sponsors.service";
import Link from "next/link";
import Image from "next/image";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await eventsService.getPublicEventBySlug(slug);
    if (!event) return { title: 'Evento não encontrado' };

    const title = event.seoTitle || event.name;
    const description = event.seoDescription || event.description?.slice(0, 160);
    const images = event.bannerUrl ? [event.bannerUrl] : [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eventhub.com';

    return {
      title,
      description,
      metadataBase: new URL(appUrl),
      alternates: {
        canonical: `/events/${event.slug}`,
      },
      openGraph: {
        title,
        description,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
    };
  } catch (e) {
    return { title: 'Evento - EventHub' };
  }
}

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

  let sponsors: any[] = [];
  try {
    sponsors = await sponsorsService.listPublicSponsors(slug);
  } catch (e) {
    console.error("Failed to fetch sponsors:", e);
  }

  const startDate = new Date(event.startDate);

  const formattedDate = startDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

  const logoToDisplay = event.logoUrl || event.tenant?.logoUrl;

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eventhub.com'}/events/${event.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.seoTitle || event.name,
    description: event.seoDescription || event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.location ? "https://schema.org/OfflineEventAttendanceMode" : "https://schema.org/OnlineEventAttendanceMode",
    location: event.location ? {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location
      }
    } : {
      '@type': 'VirtualLocation',
      url
    },
    image: event.bannerUrl ? [event.bannerUrl] : undefined,
    organizer: {
      '@type': 'Organization',
      name: event.tenant?.name || 'Organizador',
    }
  };

  return (
    <ThemeProvider themeConfig={event.themeConfig} tenantThemeConfig={event.tenant?.themeConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full emerald-gradient opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full px-6 py-12">
          <div className="max-w-7xl mx-auto px-6 space-y-4">
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
        <div className="lg:col-span-2 space-y-24">
          <section className="space-y-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-foreground">Sobre o Evento</h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>
            <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-3xl mx-auto text-center">
              {event.description || 'Nenhuma descrição fornecida para este evento.'}
            </div>
          </section>

          {/* Activities / Schedule */}
          {event.activities && event.activities.length > 0 && (
            <>
              <ScheduleGrid activities={event.activities} />
              <SpeakersSection activities={event.activities} />
            </>
          )}

          {/* New Sections: Submission and Social */}
          {event.submissionsEnabled && (
            <section className="space-y-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tight text-foreground">Chamada de Trabalhos</h2>
                <div className="w-20 h-1.5 bg-primary rounded-full" />
              </div>
              <Link 
                href={`/events/${event.slug}/submit`}
                className="max-w-2xl mx-auto flex items-center justify-between p-8 rounded-[2.5rem] bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all group"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-black uppercase tracking-widest text-secondary italic">Envie sua proposta</span>
                  <span className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">Submeter Trabalho</span>
                </div>
                <div className="p-4 bg-secondary/20 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </Link>
            </section>
          )}

          <section className="space-y-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-foreground">Compartilhe e Salve</h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>
            <div className="max-w-2xl mx-auto w-full">
              <SocialShare event={event} />
            </div>
          </section>

          {/* Sponsors Showcase */}
          <SponsorShowcase categories={sponsors} />
        </div>

        {/* Sidebar / Ticket Selection */}
        <div className="space-y-8">
          <div className="sticky top-24">
            <TicketWidget event={event} />
          </div>
        </div>
      </div>
    </main>
    </ThemeProvider>
  );
}
