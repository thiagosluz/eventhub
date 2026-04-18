'use client'; 

import { useEffect, useState, use } from 'react';
import { activitiesService, CreateActivityDto, UpdateActivityDto } from '@/services/activities.service';
import { eventsService } from '@/services/events.service';
import { Activity, Event } from '@/types/event';
import { 
  CalendarIcon, 
  MapPinIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronLeftIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityForm } from '@/components/dashboard/ActivityForm';
import { ParticipantsModal } from '@/components/dashboard/ParticipantsModal';
import { DeleteConfirmationModal } from '@/components/dashboard/DeleteConfirmationModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { toast } from 'react-hot-toast';

interface MaterialForm {
  title: string;
  fileUrl: string;
  fileType: string;
}

const EMPTY_MATERIAL: MaterialForm = { title: '', fileUrl: '', fileType: 'SLIDES' };

export default function ActivitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Deletion Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Participants Modal state
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedActivityForParticipants, setSelectedActivityForParticipants] = useState<Activity | null>(null);

  // Material Modals State
  const [uploadMaterialModal, setUploadMaterialModal] = useState<{ activityId: string; activityTitle: string } | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(EMPTY_MATERIAL);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  const [deleteMaterialModal, setDeleteMaterialModal] = useState<{ activityId: string; materialId: string } | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

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

  const handleSubmit = async (data: CreateActivityDto | UpdateActivityDto) => {
    setSubmitting(true);
    try {
      if (editingActivity) {
        await activitiesService.updateActivity(editingActivity.id, data as UpdateActivityDto);
        toast.success('Atividade atualizada!');
      } else {
        await activitiesService.createActivity(eventId, data as CreateActivityDto);
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

  const handleDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      await activitiesService.deleteActivity(activityToDelete);
      toast.success('Atividade excluída!');
      setIsDeleteModalOpen(false);
      setActivityToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir atividade.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMaterialModal) return;
    if (!materialForm.title.trim() || !materialForm.fileUrl.trim()) {
      toast.error('Preencha o título e a URL do material.');
      return;
    }

    setIsSavingMaterial(true);
    try {
      await activitiesService.addActivityMaterial(uploadMaterialModal.activityId, materialForm);
      toast.success('Material adicionado!');
      setUploadMaterialModal(null);
      setMaterialForm(EMPTY_MATERIAL);
      loadData();
    } catch {
      toast.error('Erro ao adicionar material.');
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleConfirmDeleteMaterial = async () => {
    if (!deleteMaterialModal) return;
    setIsDeletingMaterial(true);
    try {
      await activitiesService.removeActivityMaterial(deleteMaterialModal.activityId, deleteMaterialModal.materialId);
      toast.success('Material removido!');
      setDeleteMaterialModal(null);
      loadData();
    } catch {
      toast.error('Erro ao remover material.');
    } finally {
      setIsDeletingMaterial(false);
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

  if (loading) return <div className="p-8 font-black uppercase tracking-widest animate-pulse">Carregando...</div>;

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
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0 border border-primary/20">
                    <ClockIcon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-tighter mt-1">
                      {new Date(activity.startAt).getHours()}:{new Date(activity.startAt).getMinutes().toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{activity.title}</h3>
                      {activity.type && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                          {activity.type.name}
                        </span>
                      )}
                      {activity.requiresEnrollment && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                          Requer Inscrição
                        </span>
                      )}
                      {activity.requiresConfirmation && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                          Requer Confirmação
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {formatDateTime(activity.startAt)} - {formatDateTime(activity.endAt)}
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="w-3.5 h-3.5 text-emerald-500" />
                          {activity.location}
                        </div>
                      )}
                      {activity.capacity && (
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {activity.remainingSpots !== null ? `${activity.remainingSpots} Vagas Restantes` : `${activity.capacity} Vagas`}
                        </div>
                      )}
                    </div>

                    {activity.speakers && activity.speakers.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {activity.speakers.map((as: any) => (
                          <div key={as.speaker?.id || Math.random()} className="flex items-center gap-2 bg-muted/40 px-2 py-1 rounded-xl border border-border/50">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 relative">
                              {as.speaker?.avatarUrl ? (
                                <Image
                                  src={as.speaker.avatarUrl}
                                  alt={as.speaker.name || 'Speaker'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <UserIcon className="w-3 h-3 text-primary" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold">{as.speaker?.name || 'Palestrante Indisponível'}</span>
                            {as.role && (
                              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/70 bg-muted px-1.5 rounded-md">
                                {as.role.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                  <div className="flex flex-col gap-2 mt-4 md:mt-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 self-end md:self-start w-full md:w-auto">
                      {activity.requiresEnrollment && (
                        <button
                          onClick={() => {
                            setSelectedActivityForParticipants(activity);
                            setIsParticipantsModalOpen(true);
                          }}
                          className="flex-1 md:flex-none justify-center p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 shadow-sm flex items-center gap-2"
                          title="Visualizar Inscritos"
                        >
                          <UsersIcon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Inscritos</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMaterialForm(EMPTY_MATERIAL);
                          setUploadMaterialModal({ activityId: activity.id, activityTitle: activity.title });
                        }}
                        className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 shadow-sm"
                        title="Adicionar Material"
                      >
                        <DocumentIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingActivity(activity);
                          setIsModalOpen(true);
                        }}
                        className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 shadow-sm"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActivityToDelete(activity.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all border border-transparent hover:border-destructive/20 shadow-sm"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              </div>

              {/* Materiais Loop */}
              {activity.materials && activity.materials.length > 0 && (
                <div className="flex flex-col gap-2 pt-6 mt-4 border-t border-border/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Materiais da Atividade</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activity.materials.map((mat: any) => (
                      <div key={mat.id} className="group/mat flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-card hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <DocumentIcon className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-foreground truncate">{mat.title}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{mat.fileType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/mat:opacity-100 transition-opacity">
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Acessar material"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setDeleteMaterialModal({ activityId: activity.id, materialId: mat.id })}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remover material"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Activity Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Excluir Atividade?"
        description="Esta ação não pode ser desfeita. Todos os dados de inscrições e presenças desta atividade serão permanentemente removidos."
        isLoading={isDeleting}
      />

      {/* Participants Modal */}
      {isParticipantsModalOpen && selectedActivityForParticipants && (
        <ParticipantsModal
          activity={selectedActivityForParticipants}
          isOpen={isParticipantsModalOpen}
          onClose={() => {
            setIsParticipantsModalOpen(false);
            setSelectedActivityForParticipants(null);
          }}
        />
      )}

      {/* Upload Material Modal */}
      {uploadMaterialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black tracking-tight">Adicionar Material</h2>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">
                  {uploadMaterialModal.activityTitle}
                </p>
              </div>
              <button onClick={() => setUploadMaterialModal(null)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaterial} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Título do Material *
                </label>
                <div className="relative">
                  <DocumentIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-muted/30 focus:border-primary focus:bg-card outline-none font-bold text-sm transition-all"
                    placeholder="Ex: Slides da Apresentação"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Tipo de Arquivo *
                </label>
                <div className="flex gap-2">
                  {["SLIDES", "PDF", "VIDEO", "LINK"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMaterialForm({ ...materialForm, fileType: type })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        materialForm.fileType === type
                          ? "bg-primary text-white border-primary"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  URL / Link *
                </label>
                <div className="relative">
                  <CloudArrowUpIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={materialForm.fileUrl}
                    onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-muted/30 focus:border-primary focus:bg-card outline-none font-bold text-sm transition-all"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadMaterialModal(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingMaterial ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PlusIcon className="w-4 h-4" />
                  )}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Material Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteMaterialModal}
        onClose={() => setDeleteMaterialModal(null)}
        onConfirm={handleConfirmDeleteMaterial}
        title="Remover Material"
        description="Tem certeza que deseja remover este material? Esta ação não pode ser desfeita e os participantes não terão mais acesso a ele."
        confirmText="Sim, remover material"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingMaterial}
      />
    </div>
  );
}
