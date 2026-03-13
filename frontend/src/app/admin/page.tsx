"use client"

import { motion } from "framer-motion"
import { DollarSign, Users, Ticket, Activity, TrendingUp, ArrowUpRight } from "lucide-react"

export default function AdminDashboardOverview() {
  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Acompanhe as métricas de seus eventos em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option>Tech Summit Brazil 2026</option>
            <option>Marketing Digital Week</option>
            <option>Todos os Eventos</option>
          </select>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        {[{
          title: "Receita Total",
          value: "R$ 45.231,89",
          icon: DollarSign,
          trend: "+20% em relação ao último mês"
        }, {
          title: "Inscrições Conf.",
          value: "2,350",
          icon: Users,
          trend: "+180 na última semana"
        }, {
          title: "Ingressos Vendidos",
          value: "1,842",
          icon: Ticket,
          trend: "78% da capacidade total"
        }, {
          title: "Acessos na Página",
          value: "12,234",
          icon: Activity,
          trend: "Taxa de conversão: 19.2%"
        }].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6"
          >
            <div className="flex items-center justify-between space-y-0 py-2">
              <h3 className="text-sm font-medium tracking-tight text-muted-foreground">{metric.title}</h3>
              <metric.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {metric.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts area */}
      <div className="grid gap-4 md:grid-cols-7 w-full">
        
        {/* Sales Chart Mock */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="col-span-4 rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Vendas nos últimos 30 dias</h3>
            <p className="text-sm text-muted-foreground">Volume de ingressos vendidos diariamente.</p>
          </div>
          <div className="flex-1 flex items-end gap-2 h-64 mt-4">
            {/* Extremely simple CSS bar chart mock */}
            {[20, 30, 15, 45, 60, 40, 70, 85, 55, 65, 90, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-sm relative group cursor-pointer" style={{ height: `${h}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h * 12}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
            <span>01 Out</span>
            <span>15 Out</span>
            <span>30 Out</span>
          </div>
        </motion.div>

        {/* Recent Sales List */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-3 rounded-xl border border-border bg-card shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold">Vendas Recentes</h3>
              <p className="text-sm text-muted-foreground">Você teve 24 vendas hoje.</p>
            </div>
            <button className="text-sm font-medium text-primary hover:underline">Ver todas</button>
          </div>
          
          <div className="space-y-6">
            {[{
              name: "Olivia Martin",
              email: "olivia.martin@email.com",
              amount: "+R$ 299,00"
            }, {
              name: "Jackson Lee",
              email: "jackson.lee@email.com",
              amount: "+R$ 299,00"
            }, {
              name: "Isabella Nguyen",
              email: "isabella.nguyen@email.com",
              amount: "+R$ 150,00"
            }, {
              name: "William Kim",
              email: "will@email.com",
              amount: "+R$ 299,00"
            }, {
              name: "Sofia Davis",
              email: "sofia.davis@email.com",
              amount: "+R$ 49,90"
            }].map((sale, i) => (
              <div key={i} className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-medium mr-4">
                  {sale.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{sale.name}</p>
                  <p className="text-sm text-muted-foreground">{sale.email}</p>
                </div>
                <div className="ml-auto font-medium text-green-600 dark:text-green-400">
                  {sale.amount}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
