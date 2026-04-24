"use client";

import { useEffect, useState } from "react";
import {
  UsersIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import {
  Participant,
  ParticipantDetail,
  participantsService,
} from "@/services/participants.service";
import { ParticipantDetailDrawer } from "@/components/dashboard/ParticipantDetailDrawer";
import { toast } from "react-hot-toast";
import { DataTable, type DataTableColumn } from "@/components/ui";

const PAGE_SIZE = 20;

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res = await participantsService.listPaginated({
        page,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
      });
      setParticipants(res.data);
      setTotal(res.total);
    } catch {
      console.error("Error fetching participants");
      toast.error("Erro ao carregar participantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParticipants();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleViewDetails = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const detail = await participantsService.getDetail(id);
      setSelectedParticipant(detail);
      setIsDrawerOpen(true);
    } catch {
      toast.error("Erro ao carregar detalhes do participante.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await participantsService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "participantes.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Erro ao exportar participantes.");
    }
  };

  const columns: DataTableColumn<Participant>[] = [
    {
      key: "participant",
      header: "Participante",
      cell: (p) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-primary font-black uppercase text-xs">
            {p.user.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground leading-none mb-1">{p.user.name}</p>
            <p className="text-xs font-medium text-muted-foreground">{p.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "event",
      header: "Evento",
      cell: (p) => (
        <span className="text-sm font-bold text-foreground">{p.event.name}</span>
      ),
    },
    {
      key: "ticket",
      header: "Tipo de Ticket",
      align: "center",
      cell: (p) => (
        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
          {p.tickets[0]?.type || "GRATUITO"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Data Inscrição",
      align: "center",
      cell: (p) => (
        <span className="text-xs font-bold text-muted-foreground">
          {new Date(p.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      align: "right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleViewDetails(p.id)}
            disabled={isDetailLoading}
            className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all"
            title="Ver Detalhes"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <EnvelopeIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Gestão de Participantes
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Visualize e gerencie todos os inscritos nos seus eventos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="premium-button-outline !px-4 !py-3"
            title="Exportar CSV"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="premium-input pl-12 pr-6 w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-card border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Total de Participantes
            </p>
            <h3 className="text-2xl font-black text-foreground">{total}</h3>
          </div>
        </div>
      </div>

      <DataTable<Participant>
        ariaLabel="Participantes"
        data={participants}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={loading}
        emptyTitle="Nenhum participante encontrado"
        emptyDescription="Ajuste sua busca ou aguarde novas inscrições."
        emptyIcon={<UsersIcon className="w-6 h-6" />}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />

      <ParticipantDetailDrawer
        participant={selectedParticipant}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
