"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { speakersService, ActivitySpeaker, Speaker } from "@/services/speakers.service";
import { 
  CalendarIcon, 
  UserGroupIcon, 
  StarIcon,
  ArrowRightIcon,
  MicrophoneIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function SpeakerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Speaker | null>(null);
  const [activities, setActivities] = useState<ActivitySpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackAvg, setFeedbackAvg] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [me, myActivities, myFeedbacks] = await Promise.all([
          speakersService.getMe(),
          speakersService.getMyActivities(),
          speakersService.getMyFeedbacks(),
        ]);
        setProfile(me);
        setActivities(myActivities);

        if (myFeedbacks.length > 0) {
          const avg = myFeedbacks.reduce((acc, fb) => acc + fb.rating, 0) / myFeedbacks.length;
          setFeedbackAvg(avg);
        } else {
          setFeedbackAvg(null);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-card rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-card rounded-2xl" />
          <div className="h-24 bg-card rounded-2xl" />
          <div className="h-24 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  const nextActivity = activities[0]?.activity;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/60 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/20">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Olá, <span className="italic">{user?.name}</span>! 👋
          </h1>
          <p className="text-primary-foreground/90 text-lg font-medium leading-relaxed">
            Bem-vindo ao seu portal oficial. Aqui você gerencia suas apresentações, materiais e acompanha o feedback dos participantes.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <Link 
              href="/speaker/profile"
              className="bg-white text-primary px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              Editar Perfil Público
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full -ml-10 -mb-10 blur-2xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total de Atividades</p>
            <p className="text-2xl font-black text-foreground">{activities.length}</p>
          </div>
        </div>

        <div className="premium-card p-6 bg-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inscritos Totais</p>
            <p className="text-2xl font-black text-foreground">
              {activities.reduce((acc, curr) => acc + (curr.activity._count?.enrollments || 0), 0)}
            </p>
          </div>
        </div>

        <div className="premium-card p-6 bg-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <StarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Média de Feedback</p>
            {feedbackAvg !== null ? (
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-black text-foreground">{feedbackAvg.toFixed(1)}</p>
                <StarIconSolid className="w-4 h-4 text-amber-500" />
              </div>
            ) : (
              <p className="text-sm font-bold text-muted-foreground italic">Sem avaliações</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Session */}
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
            <MicrophoneIcon className="w-6 h-6 text-primary" />
            Próxima Apresentação
          </h2>
          {nextActivity ? (
            <div className="group bg-card border border-border rounded-[2rem] p-8 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3 text-primary font-bold text-sm mb-4">
                <span className="bg-primary/10 px-3 py-1 rounded-lg uppercase tracking-tighter">
                  {nextActivity.type?.name || "Palestra"}
                </span>
                <span>•</span>
                <span>{new Date(nextActivity.startAt).toLocaleDateString()} às {new Date(nextActivity.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">
                {nextActivity.title}
              </h3>
              <p className="text-muted-foreground line-clamp-3 mb-6">
                {nextActivity.description}
              </p>
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {nextActivity._count.enrollments} Confirmados
                  </span>
                </div>
                <Link 
                  href="/speaker/activities"
                  className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group/btn"
                >
                  Ver Detalhes
                  <ArrowRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-[2rem] p-12 text-center">
              <p className="text-muted-foreground font-bold">Nenhuma atividade agendada no momento.</p>
            </div>
          )}
        </div>

        {/* Quick Links / Resources */}
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Recursos Rápidos</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link 
              href="/speaker/profile"
              className="group p-6 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">1</div>
                <div>
                  <h4 className="font-bold text-foreground">Atualizar Perfil</h4>
                  <p className="text-xs text-muted-foreground">Bio, links e foto de alta resolução.</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-border group-hover:text-primary transition-colors" />
            </Link>

            <Link 
              href="/speaker/activities"
              className="group p-6 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">2</div>
                <div>
                  <h4 className="font-bold text-foreground">Enviar Slides</h4>
                  <p className="text-xs text-muted-foreground">Suba sua apresentação em PDF ou PPT.</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-border group-hover:text-primary transition-colors" />
            </Link>

            <Link 
              href="/speaker/feedbacks"
              className="group p-6 bg-card border border-border rounded-2xl flex items-center justify-between hover:bg-muted transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">3</div>
                <div>
                  <h4 className="font-bold text-foreground">Ver Feedbacks</h4>
                  <p className="text-xs text-muted-foreground">Acompanhe o que os participantes acharam.</p>
                </div>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-border group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
