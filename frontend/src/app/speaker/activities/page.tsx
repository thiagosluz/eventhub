"use client";

import { useEffect, useState } from "react";
import { speakersService, ActivitySpeaker } from "@/services/speakers.service";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CloudArrowUpIcon,
  DocumentIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function SpeakerActivitiesPage() {
  const [activities, setActivities] = useState<ActivitySpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await speakersService.getMyActivities();
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadMaterial = async (activityId: string) => {
    const title = prompt("Título do material (ex: Slides da Apresentação):");
    if (!title) return;
    
    const fileUrl = prompt("URL do arquivo (neste MVP usamos links externos):");
    if (!fileUrl) return;

    setIsUploading(activityId);
    try {
      await speakersService.addActivityMaterial(activityId, { 
        title, 
        fileUrl,
        fileType: fileUrl.endsWith('.pdf') ? 'PDF' : 'SLIDES'
      });
      toast.success("Material adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar material.");
    } finally {
      setIsUploading(null);
    }
  };

  if (isLoading) return <div className="space-y-6">{[1, 2].map(i => <div key={i} className="h-48 bg-card rounded-3xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div>
        <h1 className="text-3xl font-black text-foreground">Minha Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas sessões, locais e envie materiais para os participantes.
        </p>
      </div>

      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-[2.5rem] p-20 text-center">
            <p className="text-muted-foreground font-bold">Você não tem atividades vinculadas a este evento.</p>
          </div>
        ) : (
          activities.map((item) => (
            <div key={item.activityId} className="group bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all flex flex-col md:flex-row">
              <div className="p-8 md:p-12 flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    {item.role?.name || "Palestrante"}
                  </span>
                  <span className="bg-muted text-muted-foreground px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-border">
                    {item.activity.type?.name || "Sessão"}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary italic">{item.activity.event.name}</p>
                  <h2 className="text-3xl font-black text-foreground group-hover:text-primary transition-colors">{item.activity.title}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data e Hora</p>
                      <p className="text-sm font-bold">{new Date(item.activity.startAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {new Date(item.activity.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Local/Sala</p>
                      <p className="text-sm font-bold">{item.activity.location || "A definir"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscritos</p>
                      <p className="text-sm font-bold">{item.activity._count.enrollments} Participantes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80 bg-muted/50 border-t md:border-t-0 md:border-l border-border p-8 flex flex-col justify-between gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4 text-primary" />
                    Materiais
                  </h4>
                  <div className="bg-card rounded-2xl p-4 border border-border text-center space-y-3">
                    <p className="text-[10px] text-muted-foreground font-medium">Os participantes poderão baixar os materiais após a sessão.</p>
                    <button 
                      onClick={() => handleUploadMaterial(item.activityId)}
                      disabled={isUploading === item.activityId}
                      className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isUploading === item.activityId ? "Processando..." : (
                        <>
                          <CloudArrowUpIcon className="w-4 h-4" />
                          Enviar Slides
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Status</p>
                    <p className="text-xs font-bold text-emerald-700">Participação Confirmada</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
