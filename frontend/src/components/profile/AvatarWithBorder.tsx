"use client";

import React from "react";
import Image from "next/image";
import { CameraIcon } from "@heroicons/react/24/outline";

interface AvatarWithBorderProps {
  avatarUrl?: string | null;
  name: string;
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  onAvatarChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editable?: boolean;
}

export function AvatarWithBorder({
  avatarUrl,
  name,
  level,
  size = "md",
  onAvatarChange,
  editable = false,
}: AvatarWithBorderProps) {
  const getTier = (lvl: number) => {
    if (lvl >= 50) return "legendary";
    if (lvl >= 40) return "platinum";
    if (lvl >= 30) return "gold";
    if (lvl >= 20) return "silver";
    if (lvl >= 10) return "bronze";
    return "basic";
  };

  const tier = getTier(level);

  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-24 h-24 text-xl",
    lg: "w-32 h-32 md:w-36 md:h-36 text-3xl",
    xl: "w-40 h-40 md:w-48 md:h-48 text-4xl",
  };

  const imageSizes: Record<"sm" | "md" | "lg" | "xl", string> = {
    sm: "48px",
    md: "96px",
    lg: "(min-width: 768px) 144px, 128px",
    xl: "(min-width: 768px) 192px, 160px",
  };

  const borderStyles = {
    basic: "border-slate-800 bg-slate-900",
    bronze: "border-[#CD7F32] shadow-[0_0_15px_rgba(205,127,50,0.3)] bg-gradient-to-br from-slate-900 to-[#3e2712]",
    silver: "border-[#C0C0C0] shadow-[0_0_20px_rgba(192,192,192,0.4)] bg-gradient-to-br from-slate-900 to-[#2c2c2c]",
    gold: "border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.5)] bg-gradient-to-br from-slate-900 to-[#4a3f00]",
    platinum: "border-[#E5E4E2] shadow-[0_0_30px_rgba(229,228,226,0.6)] animate-pulse bg-gradient-to-br from-slate-900 to-[#1e2a3a]",
    legendary: "border-transparent shadow-[0_0_40px_rgba(255,255,255,0.4)] before:absolute before:inset-0 before:p-[4px] before:rounded-full before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500 before:animate-spin-slow bg-slate-900",
  };

  const levelBadgeStyles = {
    basic: "bg-slate-700",
    bronze: "bg-[#CD7F32]",
    silver: "bg-[#C0C0C0] text-slate-900",
    gold: "bg-[#FFD700] text-slate-900",
    platinum: "bg-[#E5E4E2] text-slate-900",
    legendary: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white animate-pulse",
  };

  return (
    <div className="relative group">
      <div 
        className={`rounded-full border-4 overflow-hidden relative shadow-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${sizeClasses[size]} ${tier === 'legendary' ? borderStyles.legendary : borderStyles[tier]}`}
      >
        {/* Legendary border hack using clip-path fallback or internal div */}
        {tier === 'legendary' && (
           <div className="absolute inset-0 p-[3px] rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 animate-[spin_4s_linear_infinite]" />
        )}
        
        <div className={`relative w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center ${tier === 'legendary' ? 'z-10 bg-slate-900 border-2 border-slate-950' : ''}`}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} fill sizes={imageSizes[size]} className="object-cover" />
          ) : (
            <span className="font-black text-white/20 uppercase">{name.substring(0, 2)}</span>
          )}

          {editable && (
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
              <CameraIcon className="w-8 h-8 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={onAvatarChange} />
            </label>
          )}
        </div>
      </div>

      <div 
        className={`absolute -bottom-2 right-0 md:right-2 text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-slate-950 shadow-lg z-30 ${levelBadgeStyles[tier]}`}
      >
        Lvl {level}
      </div>

      {/* Visual feedback for high tiers */}
      {tier === 'platinum' && (
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10 group-hover:scale-110 transition-transform" />
      )}
      {tier === 'legendary' && (
        <div className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-2xl -z-10 group-hover:scale-125 transition-transform duration-700" />
      )}
    </div>
  );
}
