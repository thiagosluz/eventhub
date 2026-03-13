"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, MapPin, Search, Filter } from "lucide-react"

// Mock Data
const EVENTS = [
  {
    slug: "tech-summit-2026",
    title: "Tech Summit Brazil 2026",
    date: "15-17 Outubro, 2026",
    location: "São Paulo Expo, SP",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    category: "Tecnologia",
    price: "A partir de R$ 299",
  },
  {
    slug: "marketing-digital-week",
    title: "Marketing Digital Week",
    date: "05 Novembro, 2026",
    location: "Online / Híbrido",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
    category: "Marketing",
    price: "Gratuito",
  },
  {
    slug: "startup-weekend",
    title: "Startup Weekend Rio",
    date: "12 Dezembro, 2026",
    location: "Centro de Convenções, RJ",
    image: "https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=800&auto=format&fit=crop",
    category: "Empreendedorismo",
    price: "R$ 150",
  }
]

export default function EventMarketplacePage() {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Search Hero */}
      <section className="bg-muted/30 pt-16 pb-20 border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Descubra eventos incríveis</h1>
            <p className="text-muted-foreground text-lg">Encontre conferências, workshops e encontros na sua área de interesse.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 w-full p-2 bg-background border border-border shadow-sm rounded-2xl"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar por nome, produtor ou assunto..." 
                className="w-full h-14 pl-12 pr-4 bg-transparent border-none outline-none focus:ring-0 text-base"
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-border self-center" />
            <div className="relative flex-1 flex items-center border-t md:border-t-0 border-border">
              <MapPin className="absolute left-4 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Localização" 
                className="w-full h-14 pl-12 pr-4 bg-transparent border-none outline-none focus:ring-0 text-base"
              />
            </div>
            <button className="h-14 bg-primary text-primary-foreground px-8 rounded-xl font-medium transition-transform active:scale-95 flex items-center justify-center gap-2">
              <Search className="h-4 w-4" /> Buscar
            </button>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 pt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Eventos em Destaque</h2>
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border bg-card px-4 py-2 rounded-md hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EVENTS.map((event, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              key={event.slug}
              className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Link href={`/evento/${event.slug}`} className="flex flex-col h-full">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
                    {event.category}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{event.title}</h3>
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                      {event.location}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                    <span className="font-semibold text-primary">{event.price}</span>
                    <span className="text-sm font-medium hover:underline text-muted-foreground group-hover:text-foreground transition-colors">Ver detalhes</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
