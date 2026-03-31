"use client";

import { toast } from "react-hot-toast";
import { SparklesIcon } from "@heroicons/react/24/solid";
import confetti from "canvas-confetti";

export const showXpGain = (amount: number, isLevelUp: boolean = false) => {
  if (amount <= 0 && !isLevelUp) return;

  if (isLevelUp) {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#fbbf24"],
    });

    toast.success("LEVEL UP! 🎊", {
      duration: 5000,
      icon: "⭐",
      style: {
        background: "linear-gradient(to right, #6366f1, #a855f7)",
        color: "#fff",
        fontWeight: "black",
        borderRadius: "1rem",
        border: "none",
      },
    });
  }

  if (amount > 0) {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-in fade-in slide-in-from-bottom-4" : "animate-out fade-out"
        } max-w-md w-full bg-slate-900 border border-indigo-500/30 shadow-2xl rounded-2xl pointer-events-none flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-white uppercase tracking-widest">
                +{amount} XP Ganho!
              </p>
              <p className="mt-0.5 text-xs text-indigo-300 font-bold">
                Continue assim para o próximo nível!
              </p>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 3000,
      position: "bottom-right",
    });
  }
};
