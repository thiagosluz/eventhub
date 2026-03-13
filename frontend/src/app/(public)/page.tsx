"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Users, Zap, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32">
        {/* Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-20 dark:opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-purple-500/40 to-primary/40 blur-3xl rounded-[100%]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium mb-8 backdrop-blur"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2" />
            Nova versão 2.0 disponível
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A plataforma <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">definitiva</span> para seus eventos
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Crie, gerencie e escale eventos inesquecíveis. De pequenos encontros a grandes conferências com milhares de participantes.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link 
              href="/cadastro" 
              className="inline-flex h-12 lg:h-14 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/evento" 
              className="inline-flex h-12 lg:h-14 items-center justify-center rounded-lg border border-input bg-background/50 backdrop-blur px-8 text-base font-medium transition-all hover:bg-accent hover:text-accent-foreground"
            >
              Explorar Eventos
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">Ferramentas poderosas desenhadas para organizadores profissionais.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão Descomplicada</h3>
              <p className="text-muted-foreground">Crie inscrições, monte grades de programação e acompanhe submissões num dashboard intuitivo.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <div className="h-12 w-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Engajamento de Público</h3>
              <p className="text-muted-foreground">Certificados automatizados, check-in via QR code rápido e seguro, formulários customizáveis.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Integração Total</h3>
              <p className="text-muted-foreground">Pagamentos instantâneos, Webhooks e APIs escaláveis baseadas em NestJS para customização.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Confiado por grandes empresas e comunidades</h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Logos Placeholder */}
            <div className="text-xl font-black tracking-widest uppercase">Acme Corp</div>
            <div className="text-xl font-black tracking-widest uppercase">Globex</div>
            <div className="text-xl font-black tracking-widest uppercase">Soylent</div>
            <div className="text-xl font-black tracking-widest uppercase">Initech</div>
          </div>
        </div>
      </section>
    </div>
  )
}
