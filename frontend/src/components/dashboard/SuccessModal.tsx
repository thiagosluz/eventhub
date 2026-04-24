"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { ConfirmDialog } from "@/components/ui";

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
  triggerConfetti = true,
}: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen || !triggerConfetti) return;

    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }
      const particleCount = 40 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [isOpen, triggerConfetti]);

  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={() => onClose()}
      title={title}
      description={description}
      tone="success"
      confirmText={buttonText}
      hideCancel
    />
  );
}
