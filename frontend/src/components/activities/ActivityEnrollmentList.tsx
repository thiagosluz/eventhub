"use client";

import { useEffect, useState } from "react";
import { activitiesService } from "@/services/activities.service";
import { Activity } from "@/types/event";
import { 
  CheckCircleIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  ExclamationCircleIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

interface ActivityEnrollmentListProps {
  eventId: string;
}

export function ActivityEnrollmentList({ eventId }: ActivityEnrollmentListProps) {
  const [activities, setActivities] = useState<(Activity & { isEnrolled: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      const data = await activitiesService.getMyEnrollments(eventId);
      setActivities(data);
    } catch (err) {
      console.error("Failed to fetch activities", err);
      setError("Não foi possível carregar as atividades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventId]);

  const handleEnroll = async (activityId: string) => {
    setEnrollingId(activityId);
    setError(null);
    try {
      await activitiesService.enrollInActivity(activityId);
      await fetchActivities(); // Refresh list to get updated status and remaining spots
    } catch (err: any) {
      console.error("Enrollment failed", err);
      setError(err.message || "Falha na inscrição. Verifique se há choque de horário.");
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black uppercase tracking-tight">Grade de Atividades</h3>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs font-bold animate-in fade-in slide-in-from-right-2">
            <ExclamationCircleIcon className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className={`premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
              activity.isEnrolled ? "bg-primary/5 border-primary/30" : "bg-card border-border"
            }`}
          >
            <div className="flex gap-6 items-start">
              <div className={`p-4 rounded-2xl shrink-0 flex flex-col items-center justify-center min-w-[80px] ${
                activity.isEnrolled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                <span className="text-lg font-black leading-none">
                  {new Date(activity.startAt).getHours().toString().padStart(2, '0')}:
                  {new Date(activity.startAt).getMinutes().toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Início</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold tracking-tight">{activity.title}</h4>
                  {!activity.requiresEnrollment && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded uppercase tracking-widest">
                      Inscrição Automática
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 text-primary" />
                    Até {new Date(activity.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {activity.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4 text-primary" />
                      {activity.location}
                    </div>
                  )}
                  {activity.capacity && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      {activity.remainingSpots} vagas restantes
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {activity.isEnrolled ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-xs uppercase tracking-widest border border-emerald-500/20">
                  <CheckCircleIcon className="w-4 h-4" />
                  Inscrito
                </div>
              ) : activity.requiresEnrollment ? (
                <button
                  onClick={() => handleEnroll(activity.id)}
                  disabled={enrollingId === activity.id || activity.remainingSpots === 0}
                  className="premium-button !py-3 !px-8 !text-xs !font-black shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {enrollingId === activity.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : activity.remainingSpots === 0 ? (
                    "Esgotado"
                  ) : (
                    "Quero Participar"
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground font-black text-xs uppercase tracking-widest border border-border">
                  <LockClosedIcon className="w-4 h-4" />
                  Incluso no Ingresso
                </div>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="p-12 text-center rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma atividade programada para este evento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
