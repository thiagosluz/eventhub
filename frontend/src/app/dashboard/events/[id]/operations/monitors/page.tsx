"use client";

import { useEffect, useState, use } from "react";
import { staffService, Monitor, PotentialMonitor } from "@/services/staff.service";
import { 
  UsersIcon, 
  PlusIcon, 
  UserPlusIcon,
  UserMinusIcon,
  ArrowPathIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function EventMonitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [potentialMonitors, setPotentialMonitors] = useState<PotentialMonitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadMonitors = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.listMonitors(eventId);
      setMonitors(data);
    } catch (error) {
      toast.error("Erro ao carregar monitores.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPotentialMonitors = async () => {
    try {
      const data = await staffService.listPotentialMonitors(eventId);
      setPotentialMonitors(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadMonitors();
  }, [eventId]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    loadPotentialMonitors();
  };

  const handleAssign = async (userId: string) => {
    try {
      setIsAssigning(true);
      await staffService.assignMonitor(eventId, userId);
      toast.success("Monitor atribuído com sucesso!");
      setIsDialogOpen(false);
      loadMonitors();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir monitor.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      if (!confirm("Remover monitor? Ele perderá acesso ao check-in.")) return;
      await staffService.removeMonitor(eventId, userId);
      toast.success("Monitor removido.");
      loadMonitors();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover monitor.");
    }
  };

  const filteredPotential = potentialMonitors.filter(p => 
    !monitors.some(m => m.userId === p.id) && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Equipe de Monitores</h1>
          <p className="text-muted-foreground font-medium">Gestão de ajudantes para operações ao vivo.</p>
        </div>

        <button 
          onClick={handleOpenDialog}
          className="premium-button flex items-center gap-2 !px-6 !bg-indigo-600 hover:!bg-indigo-700 shadow-indigo-200"
        >
          <UserPlusIcon className="w-5 h-5" />
          Escalar Monitor
        </button>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-xl font-bold uppercase tracking-tight">Escalar Monitor</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  placeholder="Buscar entre os inscritos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-indigo-500 outline-none font-bold text-sm transition-all"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-border bg-muted/20">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border">
                    {filteredPotential.map((p) => (
                      <tr key={p.id} className="hover:bg-card transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-[10px] font-medium text-muted-foreground uppercase">{p.email}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleAssign(p.id)}
                            disabled={isAssigning}
                            className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                          >
                            ESCALAR
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPotential.length === 0 && (
                      <tr>
                        <td className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                          Nenhum participante encontrado para exportar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-card/50 rounded-3xl border border-border">
          <ArrowPathIcon className="w-12 h-12 text-indigo-500/20 animate-spin" />
        </div>
      ) : (
        <div className="premium-card bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monitor</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contato</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monitors.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black uppercase italic">
                          {m.user.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-sm">{m.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-medium text-muted-foreground uppercase">{m.user.email}</div>
                    </td>
                    <td className="px-6 py-5 text-right w-40">
                      <button 
                        onClick={() => handleRemove(m.userId)}
                        className="text-destructive font-black text-[10px] uppercase tracking-widest hover:underline px-4"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                {monitors.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                      Nenhum monitor escalado para este evento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
