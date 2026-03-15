"use client";

import { useEffect, useState } from "react";
import { speakersService } from "@/services/speakers.service";
import { Speaker } from "@/types/event";
import { 
  UserPlusIcon, 
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      const data = await speakersService.getSpeakers();
      setSpeakers(data);
    } catch (error) {
      console.error("Error loading speakers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este palestrante?")) return;
    try {
      await speakersService.deleteSpeaker(id);
      setSpeakers(speakers.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting speaker:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Palestrantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o banco de palestrantes da sua organização.
          </p>
        </div>
        
        <Link 
          href="/dashboard/speakers/new" 
          className="premium-button flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Palestrante
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : speakers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Nenhum palestrante encontrado</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Comece cadastrando palestrantes que poderão ser vinculados às atividades dos seus eventos.
          </p>
          <Link 
            href="/dashboard/speakers/new" 
            className="mt-6 text-primary font-bold hover:underline underline-offset-4"
          >
            Cadastrar primeiro palestrante
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <div 
              key={speaker.id} 
              className="group bg-card rounded-3xl border border-border p-6 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border-2 border-border group-hover:border-primary/20 transition-colors">
                  {speaker.avatarUrl ? (
                    <img 
                      src={speaker.avatarUrl} 
                      alt={speaker.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UserIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate">
                    {speaker.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {speaker.bio || "Sem biografia cadastrada."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Link
                  href={`/dashboard/speakers/${speaker.id}/edit`}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Editar"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleDelete(speaker.id)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Excluir"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
