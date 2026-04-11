"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { tenantsService } from "@/services/tenants.service";
import { Tenant } from "@/types/event";
import { 
  MagnifyingGlassIcon, 
  ChevronRightIcon, 
  MapPinIcon, 
  CalendarIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

export default function OrganizersDirectoryPage() {
  const [organizers, setOrganizers] = useState<(Tenant & { _count: { events: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    try {
      const data = await tenantsService.getAllPublic();
      setOrganizers(data);
    } catch (error) {
      console.error("Erro ao carregar organizadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizers = organizers.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Descobrindo Organizadores...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20 px-6">
      {/* Hero Section */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <SparklesIcon className="w-3 h-3" />
              Ecosistema EventHub
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground uppercase leading-[0.9]">
              Descubra os Melhores <span className="text-primary italic">Organizadores</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Explore instituições, empresas e comunidades que estão transformando o mercado de eventos.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar organizador por nome ou bio..."
              className="premium-input w-full h-16 pl-14 pr-6 !rounded-2xl text-lg shadow-xl shadow-primary/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="max-w-7xl mx-auto">
        {filteredOrganizers.length === 0 ? (
          <div className="py-20 text-center space-y-4 premium-card bg-muted/30 border-dashed border-2">
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Nenhum organizador encontrado.</p>
            <button onClick={() => setSearchTerm("")} className="text-primary font-black text-xs uppercase underline decoration-2 underline-offset-4">Limpar Busca</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrganizers.map((org) => (
              <Link 
                key={org.id} 
                href={`/organizers/${org.slug}`}
                className="group premium-card bg-card border-border hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col"
              >
                {/* Banner / Cover */}
                <div className="h-32 relative overflow-hidden bg-primary/10">
                  {org.coverUrl ? (
                    <img src={org.coverUrl} alt={org.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  
                  {/* Event Count Badge */}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm border border-border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                    {org._count.events} {org._count.events === 1 ? 'Evento' : 'Eventos'}
                  </div>
                </div>

                <div className="p-8 pt-0 -mt-8 relative z-10 flex-1 flex flex-col">
                  {/* Logo */}
                  <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-xl mb-4 overflow-hidden flex items-center justify-center bg-muted">
                    {org.logoUrl ? (
                      <Image 
                        src={org.logoUrl} 
                        alt={org.name} 
                        width={80} 
                        height={80} 
                        className="w-full h-full object-contain p-2" 
                      />
                    ) : (
                      <span className="text-2xl font-black text-primary italic">{org.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors uppercase">{org.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 font-medium italic">
                      {org.bio || "Este organizador ainda não possui uma biografia pública."}
                    </p>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      Ativo na Plataforma
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
