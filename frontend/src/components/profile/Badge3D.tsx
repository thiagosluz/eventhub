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

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    setRotate({ x: rotateX, y: rotateY });
    setShine({ 
      x: (x / rect.width) * 100, 
      y: (y / rect.height) * 100,
      opacity: 0.5
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setShine(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div 
      className={`relative perspective-1000 w-full h-[320px] transition-all duration-300 ${isEarned ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={isEarned ? onClick : undefined}
    >
      <div
        ref={cardRef}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 ? 'transform 0.5s ease-out' : 'none',
        }}
        className={`relative w-full h-full rounded-[2.5rem] bg-slate-950 border ${isEarned ? 'border-white/10 shadow-2xl' : 'border-dashed border-white/5'} overflow-hidden flex flex-col items-center p-8 text-center preserve-3d`}
      >
        {/* Holographic Shine Overlay */}
        {isEarned && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: shine.opacity,
              transition: 'opacity 0.3s'
            }}
          />
        )}

        {/* Specular highlights for metallic look */}
        {isEarned && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />
        )}

        {/* Event Banner */}
        <div className="absolute top-4 left-0 right-0 text-center opacity-40">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
              {eventName || "PLATAFORMA"}
           </span>
        </div>

        {/* The Badge Icon Container */}
        <div className="relative mt-6 mb-8 preserve-3d">
            {/* Glow behind icon */}
            {isEarned && (
                <div 
                  className={`absolute inset-0 blur-2xl rounded-full opacity-40 animate-pulse`}
                  style={{ backgroundColor: scheme.glow }}
                />
            )}
            
            <div className={`w-28 h-28 rounded-full flex items-center justify-center relative z-10 
              ${isEarned 
                 ? `bg-gradient-to-br ${scheme.bg} border-4 border-slate-900 shadow-xl` 
                 : 'bg-slate-900 border-4 border-slate-800'}`}
            >
                {isEarned ? (
                   iconUrl ? (
                     iconUrl.startsWith('http') || iconUrl.startsWith('/') || iconUrl.startsWith('data:') ? (
                       <img src={iconUrl} alt={name} className="w-16 h-16 object-contain" />
                     ) : (
                       <span className="text-5xl drop-shadow-xl">{iconUrl}</span>
                     )
                   ) : <CheckBadgeIcon className="w-14 h-14 text-white drop-shadow-lg" />
                ) : (
                   <LockClosedIcon className="w-12 h-12 text-slate-700" />
                )}
            </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2 relative z-10">
           <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isEarned ? scheme.text : 'text-slate-600'}`}>
              {isEarned ? color.toUpperCase() : "BLOQUEADO"}
           </p>
           <h3 className={`text-xl font-black ${isEarned ? 'text-white' : 'text-slate-500'} leading-tight px-2`}>
              {name}
           </h3>
           <p className={`text-xs font-medium px-4 line-clamp-2 ${isEarned ? 'text-slate-400' : 'text-slate-600 italic'}`}>
              {isEarned ? description : "???"}
           </p>
        </div>

        {/* Earned Date Footer */}
        {isEarned && earnedAt && (
           <div className="absolute bottom-5 left-0 right-0">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
                 RECONHECIDO EM {new Date(earnedAt).toLocaleDateString('pt-BR')}
              </span>
           </div>
        )}
        
        {!isEarned && (
           <div className="absolute bottom-5 left-0 right-0">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em]">
                 EM BUSCA DA GLÓRIA
              </span>
           </div>
        )}
      </div>
      
      {/* Dynamic Background Glow shadowing */}
      {isEarned && (
        <div 
          className="absolute -inset-4 blur-[80px] -z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-1000"
          style={{ backgroundColor: scheme.glow }}
        />
      )}
    </div>
  );
}
