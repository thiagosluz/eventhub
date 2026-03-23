"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Speaker } from "@/services/speakers.service";

interface SpeakerCardProps {
  speaker: Speaker;
  onClick: (speaker: Speaker) => void;
}

export function SpeakerCard({ speaker, onClick }: SpeakerCardProps) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(speaker)}
      className="flex flex-col items-center gap-4 group text-center"
    >
      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-background shadow-xl group-hover:border-primary/50 transition-colors">
        {speaker.avatarUrl ? (
          <Image
            src={speaker.avatarUrl}
            alt={speaker.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-black text-muted-foreground uppercase">
            {speaker.name.substring(0, 2)}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-sm md:text-base leading-tight group-hover:text-primary transition-colors max-w-[160px]">
          {speaker.name}
        </h4>
      </div>
    </motion.button>
  );
}
