"use client";

import { useState, useMemo } from "react";
import { Speaker } from "@/services/speakers.service";
import { SpeakerCard } from "./SpeakerCard";
import { SpeakerDetailsModal } from "./SpeakerDetailsModal";
import { motion } from "framer-motion";

interface SpeakersSectionProps {
  activities: any[];
}

export function SpeakersSection({ activities }: SpeakersSectionProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const speakers = useMemo(() => {
    const speakerMap = new Map<string, Speaker>();
    
    activities.forEach((activity) => {
      activity.speakers?.forEach((as: any) => {
        if (as.speaker && !speakerMap.has(as.speaker.id)) {
          speakerMap.set(as.speaker.id, as.speaker);
        }
      });
    });

    return Array.from(speakerMap.values());
  }, [activities]);

  if (speakers.length === 0) return null;

  const displayedSpeakers = showAll ? speakers : speakers.slice(0, 8);

  const handleSpeakerClick = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setIsModalOpen(true);
  };

  return (
    <section className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Palestrantes e Convidados</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-12">
        {displayedSpeakers.map((speaker) => (
          <SpeakerCard
            key={speaker.id}
            speaker={speaker}
            onClick={handleSpeakerClick}
          />
        ))}
      </div>

      {speakers.length > 8 && !showAll && (
        <div className="flex justify-center pt-8">
          <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setShowAll(true)}
             className="px-12 py-4 rounded-full bg-primary text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all italic"
          >
            Ver Todos
          </motion.button>
        </div>
      )}

      <SpeakerDetailsModal
        speaker={selectedSpeaker}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
