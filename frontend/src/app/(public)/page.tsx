"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest shadow-sm">
            ✨ Nova geração de gestão de eventos
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground max-w-5xl leading-[1]">
            Simplifique a gestão do seu <span className="text-primary">próximo evento.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            A solução completa para organizadores exigentes. Venda ingressos, gerencie inscrições e submissões científicas com uma interface intuitiva e profissional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 pt-4">
            <Link href="/auth/register" className="premium-button text-lg !px-10 shadow-xl shadow-primary/30">
              Começar Agora Gratuitamente
            </Link>
            <button className="premium-button-outline text-lg !px-10">
              Ver Demonstração
            </button>
          </div>

          <div className="pt-16 w-full max-w-6xl">
            <div className="premium-card aspect-video relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="h-full w-full flex flex-col p-1">
                {/* Simulated UI header */}
                <div className="h-10 border-b border-border/50 flex items-center px-4 gap-2 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/30" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/30" />
                    <div className="w-3 h-3 rounded-full bg-green-400/30" />
                  </div>
                  <div className="mx-auto w-1/3 h-5 bg-border/30 rounded-md" />
                </div>
                {/* Simulated content */}
                <div className="flex-1 grid grid-cols-12 gap-6 p-8">
                  <div className="col-span-3 space-y-4">
                    <div className="h-8 bg-primary/10 rounded-lg w-full" />
                    <div className="h-8 bg-muted rounded-lg w-4/5" />
                    <div className="h-8 bg-muted rounded-lg w-full" />
                    <div className="h-8 bg-muted rounded-lg w-3/4" />
                  </div>
                  <div className="col-span-9 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 bg-card border border-border rounded-xl p-4 space-y-2">
                        <div className="h-3 bg-muted w-1/2 rounded" />
                        <div className="h-6 bg-primary/20 w-3/4 rounded" />
                      </div>
                      <div className="h-24 bg-card border border-border rounded-xl p-4 space-y-2">
                        <div className="h-3 bg-muted w-1/2 rounded" />
                        <div className="h-6 bg-emerald-500/20 w-3/4 rounded" />
                      </div>
                      <div className="h-24 bg-card border border-border rounded-xl p-4 space-y-2">
                        <div className="h-3 bg-muted w-1/2 rounded" />
                        <div className="h-6 bg-amber-500/20 w-3/4 rounded" />
                      </div>
                    </div>
                    <div className="h-64 bg-muted/20 border border-border/50 rounded-2xl animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer-ish section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto premium-card bg-primary p-12 text-center text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Pronto para transformar seu evento?</h2>
          <p className="text-primary-foreground/90 text-xl max-w-2xl mx-auto font-medium">
            Junte-se a milhares de organizadores que já utilizam o EventHub para criar experiências memoráveis.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register" className="premium-button !px-10 !py-4">
              Criar Minha Conta Grátis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
