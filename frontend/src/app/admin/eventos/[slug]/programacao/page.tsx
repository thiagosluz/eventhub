"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, MapPin, Plus, User, FileEdit, Trash2, GripVertical } from "lucide-react"

export default function ScheduleConfigurationPage() {
  const activities = [
    { id: 1, title: "Abertura Oficial", time: "09:00 - 09:45", speaker: "João S. (Organizador)", type: "Keynote" },
    { id: 2, title: "O Futuro da Inteligência Artificial", time: "10:00 - 11:30", speaker: "John Doe (Acme Corp)", type: "Palestra" },
    { id: 3, title: "Coffee Break / Networking", time: "11:30 - 12:00", speaker: "-", type: "Intervalo" },
    { id: 4, title: "Construindo Sistemas Escaláveis", time: "12:00 - 13:30", speaker: "Jane Smith (TechLead)", type: "Workshop" },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/eventos/tech-summit-2026" className="p-2 border border-border rounded-md bg-background hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grade de Programação</h1>
            <p className="text-sm text-muted-foreground">Tech Summit Brazil 2026</p>
          </div>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Atividade
        </button>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-4">
          <Link href="/admin/eventos/tech-summit-2026" className="border-b-2 border-transparent py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">Informações Básicas</Link>
          <button className="border-b-2 border-primary py-3 px-2 text-sm font-medium text-primary">Programação</button>
          <button className="border-b-2 border-transparent py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">Submissões (Call for Papers)</button>
        </nav>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        
        {/* Painel Lateral de Dias */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold px-2 mb-2 text-sm text-muted-foreground uppercase tracking-wider">Dias do Evento</h3>
          <button className="w-full text-left px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium border border-primary/20 flex justify-between items-center">
            <span>Dia 1 (15 Out)</span>
            <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">4</span>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors flex justify-between items-center">
            <span>Dia 2 (16 Out)</span>
            <span className="text-xs font-bold bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">0</span>
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors flex justify-between items-center">
            <span>Dia 3 (17 Out)</span>
            <span className="text-xs font-bold bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">0</span>
          </button>
        </div>

        {/* Lista de Atividades (Arrástaveis Mock) */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            
            {activities.map((act, i) => (
              <motion.div 
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-4 p-4 mb-3 last:mb-0 rounded-lg border shadow-sm ${act.type === 'Intervalo' ? 'bg-muted/50 border-transparent border-dashed' : 'bg-card border-border hover:border-primary/40'}`}
              >
                <div className="hidden sm:flex items-center text-muted-foreground/50 cursor-grab hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold ${act.type === 'Intervalo' ? 'text-muted-foreground' : 'text-foreground'}`}>{act.title}</h4>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"><FileEdit className="h-4 w-4" /></button>
                      <button className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {act.time}</span>
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {act.speaker}</span>
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{act.type}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <button className="w-full py-4 mt-6 border-2 border-dashed border-border rounded-xl text-muted-foreground font-medium hover:border-primary/50 hover:text-primary transition-colors hover:bg-primary/5 flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Adicionar Atividade
            </button>
            
          </div>
        </div>

      </div>
    </div>
  )
}
