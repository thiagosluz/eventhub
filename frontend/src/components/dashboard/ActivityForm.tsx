"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  activityTypesService,
  speakerRolesService,
  ActivityType,
  SpeakerRole,
} from "@/services/management.service";
import { speakersService, Speaker } from "@/services/speakers.service";
import { Activity } from "@/types/event";
import { Button, Input, Textarea } from "@/components/ui";
import {
  activitySchema,
  type ActivityInput,
} from "@/lib/validation/activities";
import { QuickCategoryModal } from "./QuickCategoryModal";

interface ActivityFormProps {
  initialData?: Activity | null;
  onSubmit: (data: ActivitySubmitPayload) => Promise<void>;
  isLoading: boolean;
}

export interface ActivitySubmitPayload {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  typeId?: string;
  requiresEnrollment: boolean;
  requiresConfirmation: boolean;
  confirmationDays?: number;
  speakers: { speakerId: string; roleId: string }[];
}

function toInputDateTime(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function toDefaultValues(initialData?: Activity | null): ActivityInput {
  return {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    location: initialData?.location ?? "",
    startAt: toInputDateTime(initialData?.startAt),
    endAt: toInputDateTime(initialData?.endAt),
    capacity:
      initialData?.capacity !== undefined && initialData?.capacity !== null
        ? String(initialData.capacity)
        : "",
    typeId: initialData?.type?.id ?? "",
    requiresEnrollment: initialData?.requiresEnrollment ?? false,
    requiresConfirmation: initialData?.requiresConfirmation ?? false,
    confirmationDays: initialData?.confirmationDays ?? 1,
    speakers: (initialData?.speakers ?? []).map((s) => ({
      speakerId:
        (s as { speaker?: { id?: string }; speakerId?: string }).speaker?.id ??
        (s as { speakerId?: string }).speakerId ??
        "",
      roleId:
        (s as { role?: { id?: string }; roleId?: string }).role?.id ??
        (s as { roleId?: string }).roleId ??
        "",
    })),
  };
}

export function ActivityForm({ initialData, onSubmit, isLoading }: ActivityFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    mode: "onBlur",
    defaultValues: toDefaultValues(initialData),
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "speakers",
  });

  const requiresEnrollment = watch("requiresEnrollment");
  const requiresConfirmation = watch("requiresConfirmation");

  const [types, setTypes] = useState<ActivityType[]>([]);
  const [roles, setRoles] = useState<SpeakerRole[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);

  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState<"ACTIVITY_TYPE" | "SPEAKER_ROLE">(
    "ACTIVITY_TYPE",
  );

  useEffect(() => {
    reset(toDefaultValues(initialData));
  }, [initialData, reset]);

  useEffect(() => {
    Promise.all([
      activityTypesService.list(),
      speakerRolesService.list(),
      speakersService.getSpeakers(),
    ])
      .then(([t, r, s]) => {
        setTypes(t);
        setRoles(r);
        setAvailableSpeakers(s);
      })
      .catch((err) => {
        console.error("Failed to load activity form data:", err);
      });
  }, []);

  const submit = async (values: ActivityInput) => {
    const capacityNum = values.capacity ? Number(values.capacity) : undefined;
    await onSubmit({
      title: values.title,
      description: values.description || undefined,
      location: values.location || undefined,
      startAt: values.startAt,
      endAt: values.endAt,
      capacity: capacityNum,
      typeId: values.typeId || undefined,
      requiresEnrollment: values.requiresEnrollment,
      requiresConfirmation: values.requiresEnrollment
        ? values.requiresConfirmation
        : false,
      confirmationDays:
        values.requiresEnrollment && values.requiresConfirmation
          ? values.confirmationDays
          : undefined,
      speakers: values.speakers.filter((s) => s.speakerId),
    });
  };

  const handleQuickCreate = (item: { id: string; name: string }) => {
    if (quickModalType === "ACTIVITY_TYPE") {
      setTypes((prev) => [...prev, item]);
    } else {
      setRoles((prev) => [...prev, item]);
    }
  };

  const selectClass =
    "w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm appearance-none";

  return (
    <>
      <form
        aria-label="Formulário de Atividade"
        onSubmit={handleSubmit(submit)}
        className="space-y-8"
        noValidate
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                id="title"
                label="Título da Atividade"
                required
                placeholder="Ex: Palestra de Abertura"
                error={errors.title?.message}
                {...register("title")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label
                  htmlFor="typeId"
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground"
                >
                  Tipo de Atividade
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickModalType("ACTIVITY_TYPE");
                      setIsQuickModalOpen(true);
                    }}
                    className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-0.5"
                  >
                    <PlusIcon className="w-2.5 h-2.5" /> Novo
                  </button>
                  <Link
                    href="/dashboard/settings/categories"
                    target="_blank"
                    className="text-[9px] font-black uppercase text-muted-foreground hover:text-primary flex items-center gap-0.5"
                  >
                    <Cog6ToothIcon className="w-2.5 h-2.5" /> Gerenciar
                  </Link>
                </div>
              </div>
              <select
                id="typeId"
                className={selectClass}
                {...register("typeId")}
              >
                <option value="">Selecione um tipo...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer group mt-6">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20"
                  {...register("requiresEnrollment")}
                />
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Requer Inscrição Prévia
                </span>
              </label>
            </div>

            {requiresEnrollment && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20"
                      {...register("requiresConfirmation")}
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

                {requiresConfirmation && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <label
                      htmlFor="confirmationDays"
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1"
                    >
                      Prazo para Confirmação (Dias)
                    </label>
                    <Controller
                      control={control}
                      name="confirmationDays"
                      render={({ field }) => (
                        <select
                          id="confirmationDays"
                          className="w-full h-10 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <option key={d} value={d}>
                              {d} {d === 1 ? "dia" : "dias"}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Textarea
            id="description"
            label="Descrição"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="startAt"
              type="datetime-local"
              label="Data/Hora Início"
              required
              leftAddon={<CalendarIcon className="w-4 h-4" />}
              error={errors.startAt?.message}
              {...register("startAt")}
            />
            <Input
              id="endAt"
              type="datetime-local"
              label="Data/Hora Término"
              required
              leftAddon={<CalendarIcon className="w-4 h-4" />}
              error={errors.endAt?.message}
              {...register("endAt")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="location"
              label="Localização (Opcional)"
              placeholder="Ex: Auditório Principal"
              leftAddon={<MapPinIcon className="w-4 h-4" />}
              error={errors.location?.message}
              {...register("location")}
            />
            <Input
              id="capacity"
              type="number"
              label="Capacidade (Vagas)"
              placeholder="Ilimitada se vazio"
              leftAddon={<UsersIcon className="w-4 h-4" />}
              error={errors.capacity?.message}
              {...register("capacity")}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                Palestrantes e Papéis
              </label>
              <button
                type="button"
                onClick={() => append({ speakerId: "", roleId: "" })}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <PlusIcon className="w-3 h-3" /> Adicionar Palestrante
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-end bg-muted/20 p-4 rounded-2xl border border-border/50"
                >
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor={`speaker-${index}`}
                      className="text-[10px] font-black uppercase text-muted-foreground"
                    >
                      Palestrante
                    </label>
                    <div className="relative">
                      <Controller
                        control={control}
                        name={`speakers.${index}.speakerId`}
                        render={({ field: f }) => (
                          <select
                            id={`speaker-${index}`}
                            className="w-full h-11 pl-11 pr-3 rounded-lg border border-border bg-card outline-none text-xs font-bold appearance-none transition-all focus:border-primary"
                            value={f.value}
                            onChange={(e) => {
                              f.onChange(e.target.value);
                              update(index, {
                                ...field,
                                speakerId: e.target.value,
                                roleId: field.roleId ?? "",
                              });
                            }}
                            onBlur={f.onBlur}
                          >
                            <option value="">Selecione...</option>
                            {availableSpeakers.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                        {(() => {
                          const selectedSpeaker = availableSpeakers.find(
                            (sp) => sp.id === watch(`speakers.${index}.speakerId`),
                          );
                          return selectedSpeaker?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                    {errors.speakers?.[index]?.speakerId && (
                      <p role="alert" className="text-xs text-red-500 font-medium">
                        {errors.speakers[index]?.speakerId?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`role-${index}`}
                        className="text-[10px] font-black uppercase text-muted-foreground"
                      >
                        Papel
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickModalType("SPEAKER_ROLE");
                          setIsQuickModalOpen(true);
                        }}
                        className="text-[8px] font-black uppercase text-primary hover:underline flex items-center gap-0.5"
                      >
                        <PlusIcon className="w-2 h-2" /> Novo
                      </button>
                    </div>
                    <Controller
                      control={control}
                      name={`speakers.${index}.roleId`}
                      render={({ field: f }) => (
                        <select
                          id={`role-${index}`}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none text-xs font-bold"
                          value={f.value ?? ""}
                          onChange={(e) => f.onChange(e.target.value)}
                          onBlur={f.onBlur}
                        >
                          <option value="">Padrão</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    aria-label="Remover palestrante"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-xs text-center py-4 text-muted-foreground italic">
                  Nenhum palestrante associado.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isLoading} size="lg">
            {initialData ? "Salvar Alterações" : "Criar Atividade"}
          </Button>
        </div>
      </form>

      <QuickCategoryModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        type={quickModalType}
        onCreated={handleQuickCreate}
      />
    </>
  );
}
