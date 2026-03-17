import { useEffect, useState, useCallback } from 'react';
import { activitiesService } from '@/services/activities.service';
import { Activity, ActivityEnrollment } from '@/types/event';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface ParticipantsModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
}

export function ParticipantsModal({ activity, isOpen, onClose }: ParticipantsModalProps) {
  const [enrollments, setEnrollments] = useState<ActivityEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEnrollments();
    }
  }, [isOpen, activity.id]);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activitiesService.listEnrollments(activity.id);
      setEnrollments(data);
    } catch (error: unknown) {
      toast.error('Erro ao carregar inscritos.');
    } finally {
      setLoading(false);
    }
  }, [activity.id]);

  const handleConfirm = async (enrollmentId: string) => {
    setConfirmingId(enrollmentId);
    try {
      await activitiesService.confirmEnrollment(activity.id, enrollmentId);
      toast.success('Inscrição confirmada!');
      loadEnrollments();
    } catch (error: unknown) {
      toast.error('Erro ao confirmar inscrição.');
    } finally {
      setConfirmingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{activity.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  Lista de Inscritos
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {enrollments.length} participantes
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border"
            >
              <XMarkIcon className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Buscando inscritos...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                <UserIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground">Nenhum inscrito ainda</p>
                <p className="text-sm text-muted-foreground">Assim que participantes se inscreverem, eles aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {enrollments.map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  className="premium-card p-4 flex items-center justify-between gap-4 group hover:border-primary/30 transition-all transition-duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {enrollment.registration.user.name || 'Sem nome'}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {enrollment.registration.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {enrollment.status === 'CONFIRMED' && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircleIcon className="w-3 h-3" />
                          Confirmado
                        </span>
                      )}
                      {enrollment.status === 'PENDING' && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <ClockIcon className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {enrollment.status === 'CANCELLED' && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                          <XCircleIcon className="w-3 h-3" />
                          Cancelado
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-muted-foreground/50">
                        {new Date(enrollment.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {enrollment.status === 'PENDING' && (
                      <button
                        onClick={() => handleConfirm(enrollment.id)}
                        disabled={confirmingId === enrollment.id}
                        className="bg-primary text-primary-foreground p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        title="Confirmar Inscrição"
                      >
                        {confirmingId === enrollment.id ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border shrink-0 bg-muted/20">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmados
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Pendentes
              </span>
            </div>
            <span>EventHub Registry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
