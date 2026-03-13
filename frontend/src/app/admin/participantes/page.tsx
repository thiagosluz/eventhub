"use client"

import { motion } from "framer-motion"
import { Search, Filter, Download, UserPlus, FileSpreadsheet, MoreVertical } from "lucide-react"

export default function AdminParticipantsPage() {
  const participants = [
    { id: "1023", name: "Olivia Martin", email: "olivia.martin@email.com", ticket: "Passe Completo", status: "Pago", checkin: false },
    { id: "1024", name: "Jackson Lee", email: "jackson.lee@email.com", ticket: "VIP", status: "Pago", checkin: true },
    { id: "1025", name: "Isabella Nguyen", email: "isabella.nguyen@email.com", ticket: "Passe Básico", status: "Pago", checkin: false },
    { id: "1026", name: "William Kim", email: "will@email.com", ticket: "Passe Completo", status: "Pendente", checkin: false },
    { id: "1027", name: "Sofia Davis", email: "sofia.davis@email.com", ticket: "VIP", status: "Cancelado", checkin: false },
    { id: "1028", name: "Lucas Garcia", email: "lucas@email.com", ticket: "Passe Completo", status: "Pago", checkin: true },
    { id: "1029", name: "Amanda Silva", email: "amanda@email.com", ticket: "Passe Completo", status: "Pago", checkin: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participantes</h1>
          <p className="text-muted-foreground">Gerencie inscrições, reenvie ingressos e registre credenciamento.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Nova Inscrição
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar participante..." 
              className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
               <Filter className="h-4 w-4 mr-2" /> Filtros
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Pedido</th>
                <th scope="col" className="px-6 py-3 font-medium">Participante</th>
                <th scope="col" className="px-6 py-3 font-medium">Ingresso</th>
                <th scope="col" className="px-6 py-3 font-medium">Status / Pgt</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Check-in</th>
                <th scope="col" className="px-6 py-3 flex justify-end"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {participants.map((p, i) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={p.id} 
                  className="bg-card hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-muted-foreground whitespace-nowrap">#{p.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-muted-foreground">{p.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {p.ticket}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      p.status === 'Pago' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      p.status === 'Pendente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                     }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {p.checkin ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    ) : (
                      <button className="text-xs font-medium border border-border bg-background px-3 py-1 rounded hover:border-primary/50 hover:text-primary transition-colors">
                        Fazer Check-in
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <div>Mostrando 1 a 7 de 2.350 registros</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded opacity-50 cursor-not-allowed">Anterior</button>
            <button className="px-3 py-1 border border-border rounded bg-background hover:bg-muted">1</button>
            <button className="px-3 py-1 border border-border rounded bg-background hover:bg-muted">2</button>
            <button className="px-3 py-1 border border-border rounded bg-background hover:bg-muted">Próxima</button>
          </div>
        </div>

      </div>
    </div>
  )
}
