"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "@heroicons/react/24/outline";
import { activityTypesService, speakerRolesService } from "@/services/management.service";
import { toast } from "react-hot-toast";
import { Modal, Input, Button } from "@/components/ui";
import {
  quickCategorySchema,
  type QuickCategoryInput,
} from "@/lib/validation/activities";

interface QuickCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: { id: string; name: string }) => void;
  type: "ACTIVITY_TYPE" | "SPEAKER_ROLE";
}

export function QuickCategoryModal({ isOpen, onClose, onCreated, type }: QuickCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickCategoryInput>({
    resolver: zodResolver(quickCategorySchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!isOpen) reset({ name: "" });
  }, [isOpen, reset]);

  const onSubmit = async (values: QuickCategoryInput) => {
    try {
      const created =
        type === "ACTIVITY_TYPE"
          ? await activityTypesService.create(values.name)
          : await speakerRolesService.create(values.name);
      toast.success(
        type === "ACTIVITY_TYPE"
          ? "Tipo de atividade criado!"
          : "Papel de palestrante criado!",
      );
      onCreated(created);
      reset({ name: "" });
      onClose();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        toast.error("Este item já existe.");
      } else {
        toast.error("Erro ao criar item.");
      }
    }
  };

  const title =
    type === "ACTIVITY_TYPE" ? "Novo Tipo de Atividade" : "Novo Papel de Palestrante";

  return (
    <Modal open={isOpen} onClose={onClose} size="sm">
      <Modal.Header>{title}</Modal.Header>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          <Input
            id="quick-name"
            autoFocus
            label={`Nome do ${type === "ACTIVITY_TYPE" ? "Tipo" : "Papel"}`}
            placeholder="Ex: Workshop, Painelista..."
            error={errors.name?.message}
            {...register("name")}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Criar e Utilizar
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
