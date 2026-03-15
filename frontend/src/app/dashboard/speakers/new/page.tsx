"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { speakersService } from "@/services/speakers.service";
import { SpeakerForm } from "@/components/dashboard/SpeakerForm";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewSpeakerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await speakersService.createSpeaker(data);
      router.push("/dashboard/speakers");
    } catch (error) {
      console.error("Error creating speaker:", error);
      alert("Erro ao criar palestrante. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link 
          href="/dashboard/speakers" 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group"
        >
          <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para Palestrantes
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Novo Palestrante
        </h1>
        <p className="text-muted-foreground mt-1">
          Cadastre um palestrante para ser utilizado em seus eventos.
        </p>
      </div>

      <SpeakerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
