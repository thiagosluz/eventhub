"use client";

import { useEffect, useState } from "react";
import { 
  UsersIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { Participant, ParticipantDetail, participantsService } from "@/services/participants.service";
import { ParticipantDetailDrawer } from "@/components/dashboard/ParticipantDetailDrawer";
import { toast } from "react-hot-toast";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchParticipants = async () => {
    try {
      const data = await participantsService.list();
      setParticipants(data);
    } catch {
      console.error("Error fetching participants");
      toast.error("Erro ao carregar participantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

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

  const filteredParticipants = participants.filter(p => 
    p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = async () => {
    try {
      const response = await participantsService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'participantes.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Erro ao exportar participantes.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Sincronizando participantes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Gestão de Participantes</h1>
          <p className="text-muted-foreground font-medium">Visualize e gerencie todos os inscritos nos seus eventos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="premium-button !bg-muted !text-muted-foreground hover:!text-foreground !border-border !px-4 !py-3"
            title="Exportar CSV"
          >
             <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por nome ou email..."
              className="bg-muted/50 border-border border-2 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold focus:border-primary outline-none transition-all w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-card border-border flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <UsersIcon className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Participantes</p>
              <h3 className="text-2xl font-black text-foreground">{participants.length}</h3>
           </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="premium-card bg-card border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Participante</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Evento</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Tipo de Ticket</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Data Inscrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParticipants.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-primary font-black uppercase text-xs">
                        {p.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-none mb-1">{p.user.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{p.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-foreground">{p.event.name}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                      {p.tickets[0]?.type || "GRATUITO"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-xs font-bold text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewDetails(p.id)}
                        disabled={isDetailLoading}
                        className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all group/btn relative"
                        title="Ver Detalhes"
                      >
                        <EyeIcon className="w-5 h-5" />
                        {isDetailLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                      <button className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                        <EnvelopeIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredParticipants.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <UsersIcon className="w-12 h-12" />
                      <p className="text-sm font-black uppercase tracking-widest">Nenhum participante encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ParticipantDetailDrawer 
        participant={selectedParticipant}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
