"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Speaker } from "@/services/speakers.service";
import Image from "next/image";

interface SpeakerDetailsModalProps {
  speaker: Speaker | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SpeakerDetailsModal({ speaker, isOpen, onClose }: SpeakerDetailsModalProps) {
  if (!speaker) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-card w-full max-w-xl rounded-3xl border border-border shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors z-10"
            >
              <XMarkIcon className="w-6 h-6 text-muted-foreground" />
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-48 h-64 md:h-auto bg-muted">
                {speaker.avatarUrl ? (
                  <Image
                    src={speaker.avatarUrl}
                    alt={speaker.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-muted-foreground uppercase">
                    {speaker.name.substring(0, 2)}
                  </div>
                )}
              </div>

              <div className="flex-1 p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">{speaker.name}</h3>
                  {speaker.linkedinUrl && (
                    <a
                      href={speaker.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm font-bold flex items-center gap-1"
                    >
                      LinkedIn
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Sobre</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {speaker.bio || "Nenhuma biografia fornecida."}
                  </p>
                </div>

                {speaker.websiteUrl && (
                  <div className="pt-4">
                    <a
                      href={speaker.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-all font-bold text-sm"
                    >
                      Website Oficial
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
