"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { tenantsService } from "@/services/tenants.service";
import { Tenant } from "@/types/event";
import { 
  GlobeAltIcon, 
  MapPinIcon, 
  CalendarIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrganizerPublicPageData extends Tenant {
  users: any[];
  events: any[];
}

export default function OrganizerProfilePage() {
  const { slug } = useParams();
  const [data, setData] = useState<OrganizerPublicPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      const response = await tenantsService.getOnePublic(slug as string);
      setData(response);
    } catch (error) {
      console.error("Erro ao carregar organizador:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Perfil do Organizador...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Organizador não encontrado</h2>
        <Link href="/organizers" className="text-primary font-bold uppercase underline underline-offset-8 decoration-2 italic">
          Voltar para o Diretório
        </Link>
      </div>
    );
  }

  const now = new Date();
  const activeEvents = data.events.filter(e => new Date(e.endDate) >= now);
  const pastEvents = data.events.filter(e => new Date(e.endDate) < now).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const displayedPastEvents = showAllPast ? pastEvents : pastEvents.slice(0, 6);

  return (
    <main className="min-h-screen pb-32">
      {/* Premium Header / Banner */}
      <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
        {data.coverUrl ? (
          <img src={data.coverUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Logo and Mobile Header Info */}
        <div className="absolute bottom-0 left-0 w-full px-6 pb-8">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-8">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-card border-8 border-background shadow-2xl overflow-hidden flex items-center justify-center bg-muted relative z-20">
                {data.logoUrl ? (
                  <Image src={data.logoUrl} alt={data.name} width={192} height={192} className="w-full h-full object-contain p-4" />
                ) : (
                  <span className="text-5xl font-black text-primary italic">{data.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              
              <div className="flex-1 space-y-4 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Organizador Verificado
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase leading-[0.8]">
                  {data.name}
                </h1>
              </div>

              <div className="flex gap-4 pb-4">
                 {data.websiteUrl && (
                   <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-lg group">
                      <GlobeAltIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                   </a>
                 )}
                 {data.instagramUrl && (
                   <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-lg group">
                      <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                   </a>
                 )}
                 {data.linkedinUrl && (
                   <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-card border border-border hover:border-primary transition-all shadow-lg group">
                      <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                   </a>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16">
        {/* Left Content (Bio + Events) */}
        <div className="lg:col-span-8 space-y-20">
          {/* Bio Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                 <SparklesIcon className="w-4 h-4 text-primary" />
               </div>
               <h2 className="text-2xl font-black uppercase tracking-tight">Sobre a {data.name}</h2>
             </div>
             <p className="text-xl text-muted-foreground leading-relaxed font-medium italic">
               {data.bio || "Este organizador ainda não possui uma biografia pública, mas está ativo na plataforma EventHub criando experiências incríveis."}
             </p>
          </section>

          {/* Active Events */}
          <section className="space-y-8">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                   <CalendarIcon className="w-4 h-4 text-emerald-500" />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Próximos Eventos</h2>
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                 {activeEvents.length} Ativo(s)
               </span>
             </div>

             {activeEvents.length === 0 ? (
               <div className="premium-card p-12 bg-muted/20 border-border/50 border-dashed border-2 text-center text-muted-foreground font-bold italic">
                 Nenhum evento futuro agendado no momento.
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {activeEvents.map((event) => (
                   <Link key={event.id} href={`/events/${event.slug}`} className="group premium-card bg-card border-border hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col h-full">
                      <div className="h-44 relative overflow-hidden">
                        {event.bannerUrl ? (
                          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-primary/5" />
                        )}
                        <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                          Inscrições Abertas
                        </div>
                      </div>
                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-2 uppercase leading-tight">{event.name}</h3>
                        <div className="flex flex-col gap-2 mt-auto">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                             <CalendarIcon className="w-4 h-4 text-primary" />
                             {format(new Date(event.startDate), "dd 'de' MMMM", { locale: ptBR })}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                             <MapPinIcon className="w-4 h-4 text-primary" />
                             {event.location || "Online"}
                           </div>
                        </div>
                      </div>
                   </Link>
                 ))}
               </div>
             )}
          </section>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowPathIcon className="w-4 h-4 text-primary rotate-45" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Eventos Realizados</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPastEvents.map((event) => (
                   <Link key={event.id} href={`/events/${event.slug}`} className="group p-4 rounded-3xl bg-card border border-border hover:bg-muted/50 transition-all flex flex-col gap-4">
                      <div className="h-28 rounded-2xl overflow-hidden grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        {event.bannerUrl ? (
                          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1">{event.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(event.startDate), "yyyy")}</p>
                      </div>
                   </Link>
                ))}
              </div>

              {pastEvents.length > 6 && (
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setShowAllPast(!showAllPast)}
                    className="premium-button !px-10 !py-3 !text-[10px] !tracking-[0.2em] transform -skew-x-12"
                  >
                    {showAllPast ? "VER MENOS" : "VER MAIS EVENTOS PASSADOS"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Sidebar (Team + Stats) */}
        <div className="lg:col-span-4 space-y-12">
           {/* Team Section */}
           <section className="premium-card p-8 bg-card border-border space-y-8">
              <div className="flex items-center gap-3 border-b border-border pb-6">
                <UserGroupIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Nosso Time</h2>
              </div>

              <div className="space-y-6">
                {data.users.length === 0 ? (
                  <p className="text-xs font-bold text-muted-foreground italic text-center py-4">Nenhum membro público listado.</p>
                ) : (
                  data.users.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 group">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 bg-muted shrink-0 shadow-lg">
                        {member.avatarUrl ? (
                          <Image src={member.avatarUrl} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-black text-xl italic">
                            {member.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm uppercase tracking-tight truncate group-hover:text-primary transition-colors">{member.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest line-clamp-2 italic">{member.bio || "Especialista em Eventos"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </section>

           {/* Stats Card */}
           <div className="premium-card p-8 bg-zinc-900 text-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Estatísticas</h3>
              
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1">
                  <span className="text-3xl font-black italic tracking-tighter">{activeEvents.length}</span>
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Eventos Futuros</p>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-black italic tracking-tighter">{pastEvents.length}</span>
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Realizados</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                <MapPinIcon className="w-4 h-4 text-primary" />
                PLATAFORMA OFICIAL EventHub
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
