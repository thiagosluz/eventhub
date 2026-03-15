"use client";

import { useEffect, useState } from "react";
import { 
  UsersIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import api from "@/services/api";

interface Participant {
  id: string;
  user: { name: string; email: string };
  event: { name: string };
  tickets: { type: string; status: string }[];
  createdAt: string;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await api.get("/participants");
        setParticipants(response.data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter(p => 
    p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button className="premium-button !bg-muted !text-muted-foreground hover:!text-foreground !border-border !px-4 !py-3">
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
                    <button className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-all">
                      <EnvelopeIcon className="w-5 h-5" />
                    </button>
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
    </div>
  );
}
