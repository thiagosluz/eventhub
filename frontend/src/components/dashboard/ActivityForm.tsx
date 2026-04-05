import { useEffect, useState } from 'react';
import { CalendarIcon, MapPinIcon, UsersIcon, UserIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { activityTypesService, speakerRolesService, ActivityType, SpeakerRole } from '@/services/management.service';
import { speakersService, Speaker } from '@/services/speakers.service';
import { activitiesService, CreateActivityDto, UpdateActivityDto } from '@/services/activities.service';
import { Activity } from '@/types/event';

interface ActivityFormProps {
  initialData?: Activity | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function ActivityForm({ initialData, onSubmit, isLoading }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    startAt: initialData?.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : '',
    endAt: initialData?.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : '',
    capacity: initialData?.capacity || '',
    typeId: initialData?.type?.id || '',
    requiresEnrollment: initialData?.requiresEnrollment || false,
    requiresConfirmation: initialData?.requiresConfirmation || false,
    confirmationDays: initialData?.confirmationDays || 1,
    speakers: (initialData?.speakers || []).map((s: any) => ({
      speakerId: s.speaker?.id || s.speakerId || '',
      roleId: s.role?.id || s.roleId || ''
    })) as { speakerId: string; roleId: string }[]
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        location: initialData.location || '',
        startAt: initialData.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : '',
        endAt: initialData.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : '',
        capacity: initialData.capacity || '',
        typeId: initialData.type?.id || '',
        requiresEnrollment: initialData.requiresEnrollment || false,
        requiresConfirmation: initialData.requiresConfirmation || false,
        confirmationDays: initialData.confirmationDays || 1,
        speakers: (initialData.speakers || []).map((s: any) => ({
          speakerId: s.speaker?.id || s.speakerId || '',
          roleId: s.role?.id || s.roleId || ''
        })) as { speakerId: string; roleId: string }[]
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        startAt: '',
        endAt: '',
        capacity: '',
        typeId: '',
        requiresEnrollment: false,
        requiresConfirmation: false,
        confirmationDays: 1,
        speakers: []
      });
    }
  }, [initialData]);

  const [types, setTypes] = useState<ActivityType[]>([]);
  const [roles, setRoles] = useState<SpeakerRole[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    Promise.all([
      activityTypesService.list(),
      speakerRolesService.list(),
      speakersService.getSpeakers()
    ]).then(([t, r, s]) => {
      setTypes(t);
      setRoles(r);
      setAvailableSpeakers(s);
    }).catch(err => {
      console.error('Failed to load activity form data:', err);
    });
  }, []);

  const addSpeaker = () => {
    setFormData({
      ...formData,
      speakers: [...formData.speakers, { speakerId: '', roleId: '' }]
    });
  };

  const removeSpeaker = (index: number) => {
    setFormData({
      ...formData,
      speakers: formData.speakers.filter((_, i) => i !== index)
    });
  };

  const updateSpeaker = (index: number, field: 'speakerId' | 'roleId', value: string) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index][field] = value;
    setFormData({ ...formData, speakers: newSpeakers });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      typeId: formData.typeId || undefined,
      requiresConfirmation: formData.requiresEnrollment
        ? formData.requiresConfirmation
        : false,
      confirmationDays:
        formData.requiresEnrollment && formData.requiresConfirmation
          ? Number(formData.confirmationDays)
          : undefined,
      speakers: formData.speakers.filter((s) => s.speakerId),
    });
  };

  return (
    <form aria-label="Formulário de Atividade" onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Título da Atividade</label>
            <input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
              placeholder="Ex: Palestra de Abertura"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="typeId" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Tipo de Atividade</label>
            <select
              id="typeId"
              value={formData.typeId}
              onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm appearance-none"
            >
              <option value="">Selecione um tipo...</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-2 flex flex-col justify-center">
            <label className="flex items-center gap-3 cursor-pointer group mt-6">
              <input
                type="checkbox"
                checked={formData.requiresEnrollment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresEnrollment: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20"
              />
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Requer Inscrição Prévia
              </span>
            </label>
          </div>

          {formData.requiresEnrollment && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.requiresConfirmation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiresConfirmation: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Requer Confirmação do Participante
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      O participante terá um prazo para confirmar a presença.
                    </span>
                  </div>
                </label>
              </div>

              {formData.requiresConfirmation && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <label htmlFor={`confirmationDays`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    Prazo para Confirmação (Dias)
                  </label>
                  <select
                    id={`confirmationDays`}
                    value={formData.confirmationDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmationDays: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? 'dia' : 'dias'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Descrição</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
            rows={3}
          />
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="startAt" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data/Hora Início</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="startAt"
                required
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="endAt" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data/Hora Término</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="endAt"
                required
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Location and Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="location" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Localização (Opcional)</label>
            <div className="relative">
              <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                placeholder="Ex: Auditório Principal"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="capacity" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Capacidade (Vagas)</label>
            <div className="relative">
              <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                placeholder="Ilimitada se vazio"
              />
            </div>
          </div>
        </div>

        {/* Speakers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Palestrantes e Papéis</label>
            <button
              type="button"
              onClick={addSpeaker}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <PlusIcon className="w-3 h-3" /> Adicionar Palestrante
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.speakers.map((s, index) => (
              <div key={index} className="flex gap-4 items-end bg-muted/20 p-4 rounded-2xl border border-border/50">
                <div className="flex-1 space-y-2">
                  <label htmlFor={`speaker-${index}`} className="text-[10px] font-black uppercase text-muted-foreground">Palestrante</label>
                  <div className="relative">
                    <select
                      id={`speaker-${index}`}
                      value={s.speakerId}
                      onChange={(e) => updateSpeaker(index, 'speakerId', e.target.value)}
                      className="w-full h-11 pl-11 pr-3 rounded-lg border border-border bg-card outline-none text-xs font-bold appearance-none transition-all focus:border-primary"
                    >
                      <option value="">Selecione...</option>
                      {availableSpeakers.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                      {(() => {
                        const selectedSpeaker = availableSpeakers.find(sp => sp.id === s.speakerId);
                        return selectedSpeaker?.avatarUrl ? (
                          <img 
                            src={selectedSpeaker.avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-3 h-3 text-muted-foreground" />
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label htmlFor={`role-${index}`} className="text-[10px] font-black uppercase text-muted-foreground">Papel</label>
                  <select
                    id={`role-${index}`}
                    value={s.roleId}
                    onChange={(e) => updateSpeaker(index, 'roleId', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-xs font-bold"
                  >
                    <option value="">Padrão</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeSpeaker(index)}
                  className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.speakers.length === 0 && (
              <p className="text-xs text-center py-4 text-muted-foreground italic">Nenhum palestrante associado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="premium-button !px-12 flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            initialData ? 'Salvar Alterações' : 'Criar Atividade'
          )}
        </button>
      </div>
    </form>
  );
}
