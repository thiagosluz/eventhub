"use client";

import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText?: string;
  triggerConfetti?: boolean;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  buttonText = "Entendido",
  triggerConfetti = true
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && triggerConfetti) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, triggerConfetti]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-end -mt-4 -mr-4">
             <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
          </div>
          
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6 animate-bounce">
            <CheckCircleIcon className="w-12 h-12" />
          </div>

          <h3 className="text-2xl font-black mb-3 text-foreground tracking-tight">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed font-medium px-4">
            {description}
          </p>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
