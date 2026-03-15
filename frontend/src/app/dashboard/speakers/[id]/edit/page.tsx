"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { speakersService } from "@/services/speakers.service";
import { SpeakerForm } from "@/components/dashboard/SpeakerForm";
import { Speaker } from "@/types/event";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function EditSpeakerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSpeaker = async () => {
      try {
        const data = await speakersService.getSpeakerById(id);
        setSpeaker(data);
      } catch (error) {
        console.error("Error loading speaker:", error);
        router.push("/dashboard/speakers");
      } finally {
        setIsLoading(false);
      }
    };
    loadSpeaker();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await speakersService.updateSpeaker(id, data);
      router.push("/dashboard/speakers");
    } catch (error) {
      console.error("Error updating speaker:", error);
      alert("Erro ao atualizar palestrante. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-[400px] w-full bg-muted animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!speaker) return null;

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
          Editar Palestrante
        </h1>
        <p className="text-muted-foreground mt-1">
          Atualize as informações de {speaker.name}.
        </p>
      </div>

      <SpeakerForm 
        initialData={speaker} 
        onSubmit={handleSubmit} 
        isLoading={isSaving} 
      />
    </div>
  );
}
