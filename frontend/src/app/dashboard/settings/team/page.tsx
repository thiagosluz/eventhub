"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffService, Organizer } from "@/services/staff.service";
import {
  PlusIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  Button,
  DataTable,
  Input,
  Modal,
  type DataTableColumn,
} from "@/components/ui";
import {
  createOrganizerSchema,
  type CreateOrganizerInput,
} from "@/lib/validation/staff";

export default function TeamManagementPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizerInput>({
    resolver: zodResolver(createOrganizerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      temporaryPassword: "",
    },
  });

  const loadOrganizers = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.listOrganizers();
      setOrganizers(data);
    } catch {
      toast.error("Erro ao carregar equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  const onSubmit = async (values: CreateOrganizerInput) => {
    try {
      await staffService.createOrganizer(values);
      toast.success("Organizador cadastrado com sucesso!");
      setIsDialogOpen(false);
      reset({ name: "", email: "", temporaryPassword: "" });
      loadOrganizers();
    } catch (error) {
      toast.error(
        (error as Error)?.message || "Erro ao cadastrar organizador.",
      );
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    reset({ name: "", email: "", temporaryPassword: "" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Equipe da Organização
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            Gerencie os administradores e permissões da sua conta.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          Novo Organizador
        </Button>
      </div>

      <Modal open={isDialogOpen} onClose={handleClose} size="md">
        <Modal.Header>Adicionar Organizador</Modal.Header>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body className="space-y-6">
            <Input
              id="organizer-name"
              label="Nome Completo"
              required
              placeholder="Ex: João Silva"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="organizer-email"
              type="email"
              label="Email Profissional"
              required
              placeholder="email@empresa.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              id="organizer-password"
              type="password"
              label="Senha Temporária"
              required
              placeholder="Mínimo 6 caracteres"
              error={errors.temporaryPassword?.message}
              {...register("temporaryPassword")}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Cadastrar
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <DataTable<Organizer>
        ariaLabel="Organizadores"
        data={organizers}
        columns={organizerColumns}
        rowKey={(org) => org.id}
        isLoading={isLoading}
        emptyTitle="Nenhum administrador cadastrado"
        emptyDescription="Cadastre um organizador para começar."
        emptyIcon={<UsersIcon className="w-6 h-6" />}
      />
    </div>
  );
}

const organizerColumns: DataTableColumn<Organizer>[] = [
  {
    key: "admin",
    header: "Admin",
    cell: (org) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic">
          {org.name.slice(0, 2)}
        </div>
        <span className="font-bold text-sm">{org.name}</span>
      </div>
    ),
  },
  {
    key: "email",
    header: "Contato",
    cell: (org) => (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <EnvelopeIcon className="w-4 h-4 opacity-40" />
        {org.email}
      </div>
    ),
  },
  {
    key: "role",
    header: "Função",
    cell: () => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <ShieldCheckIcon className="w-3.5 h-3.5" />
        ORGANIZER
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Data",
    cell: (org) => (
      <span className="text-[10px] font-bold text-muted-foreground uppercase italic">
        {new Date(org.createdAt).toLocaleDateString("pt-BR")}
      </span>
    ),
  },
];
