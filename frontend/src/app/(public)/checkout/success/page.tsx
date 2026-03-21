"use client";

import { CheckCircleIcon, TicketIcon, HomeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    setMounted(true);
    setOrderId(String(Math.floor(Math.random() * 90000) + 10000));
    // Disparar confetes após a montagem
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start them a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-in fade-in zoom-in duration-1000">
      <div className="space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto relative z-10 animate-bounce">
            <CheckCircleIcon className="w-14 h-14" />
          </div>
          <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Inscrição <span className="text-primary italic">Confirmada!</span> 🎉
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            Parabéns! Sua vaga está garantida. Enviamos um e-mail com todos os detalhes e seu QR Code de acesso.
          </p>
        </div>

        <div className="premium-card p-6 bg-card border-border max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-bold uppercase tracking-widest">Pedido</span>
            <span className="font-black text-foreground">#EVH-{orderId}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-bold uppercase tracking-widest">Status</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg">Aprovado</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link 
            href="/tickets"
            className="premium-button !px-8 !py-4 flex items-center justify-center gap-2 group w-full sm:w-auto"
          >
            <TicketIcon className="w-5 h-5" />
            Ver Meus Ingressos
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/"
            className="px-8 h-14 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <HomeIcon className="w-5 h-5" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
