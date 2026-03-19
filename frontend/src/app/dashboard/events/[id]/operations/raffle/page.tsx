"use client";

import { useEffect, useState, use } from "react";
import { operationsService, RaffleWinner } from "@/services/operations.service";
import {
  ChevronLeftIcon,
  TrophyIcon,
  UsersIcon,
  SparklesIcon,
  ArrowPathIcon,
  XCircleIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";
import confetti from "canvas-confetti";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";

export default function RaffleToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");
  const [drawCount, setDrawCount] = useState(1);
  const [rule, setRule] = useState<'ALL_REGISTERED' | 'ONLY_CHECKED_IN'>('ONLY_CHECKED_IN');
  const [prizeName, setPrizeName] = useState('');
  const [activityId, setActivityId] = useState('');
  const [uniqueWinners, setUniqueWinners] = useState(false);
  const [excludeStaff, setExcludeStaff] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await operationsService.getRaffleHistory(id);
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getOrganizerEventById(id);
        setEvent(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
    fetchHistory();
  }, [id]);

  const handleDelete = async () => {
    if (!historyToDelete) return;
    setIsDeleting(true);
    try {
      await operationsService.deleteRaffleHistory(historyToDelete);
      fetchHistory();
      setHistoryToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!history.length) return;
    const header = ["Data/Hora", "Participante", "E-mail", "Regra/Escopo", "Prêmio", "Recebeu?"];
    const rows = history.map(h => [
      new Date(h.drawnAt).toLocaleString('pt-BR'),
      h.registration?.user?.name || "Desconhecido",
      h.registration?.user?.email || "N/A",
      h.rule === "ALL_REGISTERED" ? "Todos os Inscritos" : "Somente Check-in",
      h.prizeName || "-",
      h.hasReceived ? "Sim" : "Não"
    ]);

    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sorteios_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDraw = async () => {
    setIsDrawing(true);
    setError("");

    // Simulate a bit of "suspense"
    await new Promise(r => setTimeout(r, 2000));

    try {
      const response = await operationsService.drawRaffle(id, activityId || undefined, drawCount, rule, prizeName, uniqueWinners, excludeStaff);
      if (response.winners.length === 0) {
        setError("Nenhum participante elegível encontrado.");
      } else {
        setWinners(response.winners);
        fetchHistory();
        // Celebration!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399']
        });
      }
    } catch (err: any) {
      setError(err.message || "Erro ao realizar sorteio.");
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            href={`/dashboard/events/${id}`}
            className="p-3 rounded-2xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Sorteador de Prêmios</h1>
            <p className="text-xs font-black uppercase tracking-widest text-primary italic leading-none">{event?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
          <div className="px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qtd. Ganhadores</p>
            <input
              type="number"
              min="1"
              max="10"
              value={drawCount}
              onChange={(e) => setDrawCount(parseInt(e.target.value) || 1)}
              className="w-16 bg-transparent border-none outline-none font-black text-primary text-lg"
            />
          </div>
          <button
            onClick={handleDraw}
            disabled={isDrawing}
            className="premium-button !py-4 !px-8 flex items-center gap-3 disabled:opacity-50"
          >
            {isDrawing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            {isDrawing ? "SORTEANDO..." : "REALIZAR SORTEIO"}
          </button>
        </div>
      </div>

      {/* Config Panel */}
      <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Configuração do Sorteio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Regra</label>
            <select
              value={rule}
              onChange={(e) => setRule(e.target.value as any)}
              className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2 text-sm font-medium"
            >
              <option value="ONLY_CHECKED_IN">Somente Check-in (Presentes)</option>
              <option value="ALL_REGISTERED">Todos os Inscritos</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Escopo</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2 text-sm font-medium"
            >
              <option value="">Geral do Evento</option>
              {event?.activities?.map((a: any) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Prêmio (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Livro, Alexa..."
              value={prizeName}
              onChange={(e) => setPrizeName(e.target.value)}
              className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2 text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-2 border-t border-border mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={uniqueWinners} onChange={e => setUniqueWinners(e.target.checked)} className="rounded text-primary border-border focus:ring-primary w-4 h-4" />
            <span className="flex-1">Não repetir ganhadores <span className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">(Justo)</span></span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            <input type="checkbox" checked={excludeStaff} onChange={e => setExcludeStaff(e.target.checked)} className="rounded text-primary border-border focus:ring-primary w-4 h-4" />
            <span className="flex-1">Excluir Equipe/Organizadores</span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Link href={`/raffle-display/${id}`} target="_blank" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl transition-colors">
            <SparklesIcon className="w-4 h-4" />
            Abrir Modo Telão
          </Link>
        </div>
      </div>

      {/* Info Footer */}
      <div className="w-full max-w-4xl mx-auto bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border text-primary shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Regras Ativas do Sorteio</p>
            <div className="text-[10px] text-muted-foreground font-bold space-y-0.5 mt-1">
              <p>• O sistema garante sorteados únicos por rodada.</p>
              {uniqueWinners && <p>• Histórico restrito: ganhadores anteriores deste evento estão inelegíveis.</p>}
              {excludeStaff && <p>• Staff excluído: organizadores não participam deste sorteio.</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
            {rule === 'ALL_REGISTERED' ? "Modo: Todos os Inscritos" : "Modo: Check-in (Presentes)"}
          </span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Main Raffle Area */}
      <div className="w-full max-w-4xl mx-auto">
        {isDrawing ? (
          <div className="premium-card bg-emerald-600 p-24 text-center space-y-8 shadow-2xl shadow-emerald-500/20 animate-pulse relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
            </div>

            <TrophyIcon className="w-32 h-32 text-white/40 mx-auto animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white italic tracking-tighter">PREPARANDO O RESULTADO...</h2>
              <p className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Cruzando os dedos para os participantes!</p>
            </div>
          </div>
        ) : winners.length > 0 ? (
          <div className="space-y-8 animate-in zoom-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">🎉 Parabéns aos Vencedores!</h2>
              <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {winners.map((winner, idx) => (
                <div key={winner.registrationId} className="premium-card p-8 bg-white border-primary/20 border-2 shadow-xl hover:shadow-primary/10 transition-all flex items-center gap-6 group">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <TrophyIcon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ganhador #{idx + 1}</p>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{winner.userName}</h3>
                    <p className="text-xs font-mono font-bold text-muted-foreground">ID: {winner.registrationId.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setWinners([])}
                className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reiniciar Sorteio
              </button>
            </div>
          </div>
        ) : (
          <div className="premium-card p-24 bg-white border-border border-dashed text-center space-y-8">
            {error ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                  <XCircleIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{error}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium">
                  {rule === 'ALL_REGISTERED'
                    ? "Verifique se o evento possui inscrições suficientes que atendam aos filtros e escopo selecionados."
                    : "Somente participantes que realizaram o check-in e atendem aos filtros podem ser sorteados."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                  <TrophyIcon className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Pronto para começar?</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium">Clique no botão acima para realizar um sorteio aleatório entre os participantes presentes.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Area */}
      <div className="w-full max-w-4xl mx-auto space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground tracking-tight">Histórico de Sorteios</h3>
          <button onClick={handleExportCSV} className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Data/Hora</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Participante</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Regra / Escopo</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Prêmio</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.length > 0 ? history.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {new Date(h.drawnAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{h.registration?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{h.registration?.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {h.rule === "ALL_REGISTERED" ? "Todos os Inscritos" : "Soment. Check-in"}
                      <br />
                      <span className="italic">{h.activity?.title || "Geral"}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {h.prizeName || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={async () => {
                          await operationsService.markPrizeReceived(h.id, !h.hasReceived);
                          fetchHistory();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${h.hasReceived ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                      >
                        {h.hasReceived ? <CheckCircleIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                        {h.hasReceived ? "Entregue" : "Pendente"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          await operationsService.setRaffleDisplayVisibility(h.id, !h.isHiddenOnDisplay);
                          fetchHistory();
                        }}
                        className={`text-muted-foreground hover:text-primary transition-colors p-2 mr-2 ${h.isHiddenOnDisplay ? 'text-amber-500' : ''}`}
                        title={h.isHiddenOnDisplay ? "Mostrar no Telão" : "Ocultar do Telão"}
                      >
                        {h.isHiddenOnDisplay ? <EyeSlashIcon className="w-5 h-5 inline" /> : <EyeIcon className="w-5 h-5 inline" />}
                      </button>
                      <button
                        onClick={() => setHistoryToDelete(h.id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-2"
                        title="Excluir"
                      >
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">Nenhum sorteio realizado ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!historyToDelete}
        onClose={() => setHistoryToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Histórico de Sorteio"
        description="Tem certeza que deseja excluir este sorteio do histórico? Essa ação é permanente e não poderá ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}
