"use client";

import React, { useRef, useState, useEffect } from 'react';
import { CheckBadgeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

interface Badge3DProps {
  name: string;
  description: string;
  color: string;
  iconUrl?: string;
  isEarned?: boolean;
  eventName?: string;
  earnedAt?: string;
  onClick?: () => void;
}

const BADGE_SCHEMES: Record<string, any> = {
  emerald: { bg: "from-emerald-400 to-emerald-600", text: "text-emerald-400", glow: "rgba(52, 211, 153, 0.5)", border: "border-emerald-500/30" },
  blue: { bg: "from-blue-400 to-blue-600", text: "text-blue-400", glow: "rgba(96, 165, 250, 0.5)", border: "border-blue-500/30" },
  purple: { bg: "from-purple-400 to-purple-600", text: "text-purple-400", glow: "rgba(192, 132, 252, 0.5)", border: "border-purple-500/30" },
  gold: { bg: "from-amber-300 to-amber-500", text: "text-amber-400", glow: "rgba(251, 191, 36, 0.5)", border: "border-amber-400/30" },
  rose: { bg: "from-rose-400 to-rose-600", text: "text-rose-400", glow: "rgba(251, 113, 133, 0.5)", border: "border-rose-500/30" }
};

export function Badge3D({ name, description, color, iconUrl, isEarned = true, eventName, earnedAt, onClick }: Badge3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const scheme = BADGE_SCHEMES[color] || BADGE_SCHEMES.blue;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isEarned) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Aumentando a intensidade da rotação para sentir mais o 3D
    const rotateX = (centerY - y) / 16;
    const rotateY = (x - centerX) / 16;

    setRotate({ x: rotateX, y: rotateY });
    setShine({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.8
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setShine(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      className={`relative perspective-1000 w-full h-[360px] group transition-all duration-300 ${(isEarned || onClick) ? 'cursor-pointer' : 'cursor-default'} ${isEarned ? '' : 'opacity-50'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div
        ref={cardRef}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
        className={`relative w-full h-full rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-950 border ${isEarned ? 'border-white/20 shadow-2xl' : 'border-dashed border-white/5'} overflow-hidden flex flex-col items-center p-8 text-center preserve-3d group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]`}
      >
        {/* Holographic Layer - Rainbow sheen that moves with mouse */}
        {isEarned && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300"
            style={{
              background: `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.05) 30%, rgba(132,204,22,0.1) 40%, rgba(59,130,246,0.1) 50%, rgba(168,85,247,0.1) 60%, rgba(255,255,255,0.05) 70%, transparent 80%)`,
              backgroundPosition: `${shine.x}% ${shine.y}%`,
              backgroundSize: '200% 200%',
              opacity: shine.opacity * 0.6
            }}
          />
        )}

        {/* Specular Beam - Sharp white shine */}
        {isEarned && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              opacity: shine.opacity
            }}
          />
        )}

        {/* Edge Highlight (Metallic effect) */}
        {isEarned && (
          <div
            className="absolute inset-0 border-[3px] rounded-[2.5rem] opacity-20 pointer-events-none"
            style={{
              borderColor: 'transparent',
              backgroundImage: `linear-gradient(${135 + rotate.x * 2}deg, rgba(255,255,255,0.5) 0%, transparent 40%, rgba(255,255,255,0.2) 100%)`,
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out'
            }}
          />
        )}

        {/* Event Banner */}
        <div className="absolute top-4 left-0 right-0 text-center opacity-30 select-none">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
            {eventName || "EVENTHUB HQ"}
          </span>
        </div>

        {/* The Badge Icon Container */}
        <div className="relative mt-10 mb-8 preserve-3d translate-z-10 transition-transform duration-300 group-hover:scale-110">
          {/* Outer Glow Ring */}
          {isEarned && (
            <div
              className={`absolute -inset-4 blur-2xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
              style={{ backgroundColor: scheme.glow }}
            />
          )}

            <div className={`w-32 h-32 rounded-full flex items-center justify-center relative z-10 
              ${isEarned
              ? `bg-gradient-to-br ${scheme.bg} border-4 border-slate-800 shadow-[0_10px_30px_-5px_hex] shadow-black/60`
              : 'bg-slate-900 border-4 border-slate-800'}`}
          >
            {/* Icon Glass Filter */}
            {isEarned && (
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-[1px] mix-blend-overlay" />
            )}

            {isEarned ? (
              iconUrl ? (
                iconUrl.startsWith('http') || iconUrl.startsWith('/') || iconUrl.startsWith('data:') ? (
                  <img src={iconUrl} alt={name} className="w-16 h-16 object-contain drop-shadow-2xl" />
                ) : (
                  <span className="text-6xl drop-shadow-2xl select-none">{iconUrl}</span>
                )
              ) : <CheckBadgeIcon className="w-16 h-16 text-white drop-shadow-lg" />
            ) : (
              <LockClosedIcon className="w-12 h-12 text-slate-700" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2 relative z-10 translate-z-10">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isEarned ? scheme.text : 'text-slate-500'}`}>
            {isEarned ? color.toUpperCase() : "MISTÉRIO"}
          </p>
          <h3 className={`text-2xl font-black ${isEarned ? 'text-white' : 'text-slate-400'} tracking-tight px-2`}>
            {name}
          </h3>
          <p className={`text-[11px] leading-relaxed font-bold px-4 line-clamp-2 ${isEarned ? 'text-slate-300' : 'text-slate-600 italic'}`}>
            {isEarned ? description : "Participe das atividades e sorteios para descobrir o segredo desta conquista..."}
          </p>
        </div>

        {/* Earned Date Footer */}
        {isEarned && earnedAt && (
          <div className="absolute bottom-6 left-0 right-0 opacity-40 group-hover:opacity-80 transition-opacity">
            <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">
              CONQUISTADO EM {new Date(earnedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {!isEarned && (
          <div className="absolute bottom-6 left-0 right-0">
            <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em]">
              RECOMPENSA BLOQUEADA
            </span>
          </div>
        )}
      </div>

      {/* High-Impact Under-Glow */}
      {isEarned && (
        <div
          className="absolute -inset-10 blur-[100px] -z-10 opacity-0 group-hover:opacity-10 transition-opacity duration-1000"
          style={{ backgroundColor: scheme.glow }}
        />
      )}
    </div>
  );
}
