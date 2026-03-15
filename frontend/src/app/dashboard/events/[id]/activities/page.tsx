'use client';

import { useEffect, useState, use } from 'react';
import { activitiesService } from '@/services/activities.service';
import { eventsService } from '@/services/events.service';
import { Activity } from '@/types/event';
import { 
  CalendarIcon, 
  MapPinIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ActivityForm } from '@/components/dashboard/ActivityForm';
import { toast } from 'react-hot-toast';

export default function ActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const [activitiesData, eventData] = await Promise.all([
        activitiesService.getActivitiesForEvent(eventId),
        eventsService.getOrganizerEventById(eventId)
      ]);
      setActivities(activitiesData);
      setEvent(eventData);
    } catch (error) {
      toast.error('Erro ao carregar programação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingActivity) {
        await activitiesService.updateActivity(editingActivity.id, data);
        toast.success('Atividade atualizada!');
      } else {
        await activitiesService.createActivity(eventId, data);
        toast.success('Atividade criada!');
      }
      setIsModalOpen(false);
      setEditingActivity(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar atividade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;
    try {
      await activitiesService.deleteActivity(activityId);
      toast.success('Atividade excluída!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir atividade.');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Programação do Evento</h1>
          <p className="text-muted-foreground font-medium">{event?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingActivity(null);
              setIsModalOpen(true);
            }}
            className="premium-button flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Atividade
          </button>
          <Link href={`/dashboard/events/${eventId}`} className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2 px-2">
            <ChevronLeftIcon className="w-4 h-4" />
            Painel do Evento
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activities.length === 0 ? (
          <div className="premium-card p-12 text-center bg-card border-dashed border-2 flex flex-col items-center gap-4">
            <CalendarIcon className="w-12 h-12 text-muted-foreground opacity-20" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Nenhuma atividade cadastrada</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Comece a montar a grade do seu evento clicando no botão "Nova Atividade".
              </p>
            </div>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="premium-card p-6 bg-card border-border hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                    <ClockIcon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-tighter mt-1">
                      {new Date(activity.startAt).getHours()}:{new Date(activity.startAt).getMinutes().toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{activity.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {formatDateTime(activity.startAt)} - {formatDateTime(activity.endAt)}
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-emerald-500" />
                          {activity.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      setEditingActivity(activity);
                      setIsModalOpen(true);
                    }}
                    className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <PlusIcon className="w-6 h-6 rotate-45 text-muted-foreground" />
              </button>
            </div>
            
            <ActivityForm
              initialData={editingActivity}
              onSubmit={handleSubmit}
              isLoading={submitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
