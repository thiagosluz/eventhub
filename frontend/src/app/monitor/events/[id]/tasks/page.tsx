"use client";

import { use, useEffect, useState, useCallback } from "react";
import { kanbanService } from "@/services/kanban.service";
import { 
  ChevronLeftIcon, 
  ViewColumnsIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { KanbanBoard } from "@/components/dashboard/kanban/KanbanBoard";
import { KanbanBoard as IKanbanBoard } from "@/types/kanban";
import toast from "react-hot-toast";

export default function MonitorTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [boards, setBoards] = useState<IKanbanBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [board, setBoard] = useState<IKanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await kanbanService.getBoards(eventId);
      setBoards(data);
      if (data.length > 0 && !activeBoardId) {
        setActiveBoardId(data[0].id);
      }
    } catch {
      toast.error("Erro ao carregar quadros.");
    } finally {
      if (!activeBoardId) setLoading(false);
    }
  }, [eventId, activeBoardId]);

  const fetchBoardDetails = useCallback(async (boardId: string) => {
    try {
      setLoading(true);
      const data = await kanbanService.getBoardDetailsForMonitor(boardId);
      setBoard(data);
    } catch {
      toast.error("Erro ao carregar suas tarefas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (activeBoardId) {
      fetchBoardDetails(activeBoardId);
    }
  }, [activeBoardId, fetchBoardDetails]);

  const handleRefresh = () => {
    if (activeBoardId) fetchBoardDetails(activeBoardId);
  };

  const filteredBoard = board ? {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    }))
  } : null;

  if (loading && boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-6">
      {/* Header */}
      <div className="px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/monitor/events" className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors group">
              <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight">Minhas Tarefas</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium ml-10">
            Acompanhe e atualize o status das atividades sob sua responsabilidade.
          </p>
        </div>

        <div className="flex items-center gap-3 px-10 md:px-0">
            <div className="relative flex-1 md:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar tarefa..."
                    className="w-full bg-muted/50 border border-border rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                />
            </div>
            
            {boards.length > 1 && (
                <select 
                    value={activeBoardId || ""}
                    onChange={(e) => setActiveBoardId(e.target.value)}
                    className="bg-muted/50 border border-border rounded-xl py-2 px-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary"
                >
                    {boards.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            )}
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
           <div className="flex items-center justify-center h-full">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           </div>
        ) : filteredBoard && filteredBoard.columns.some(c => c.tasks.length > 0) ? (
          <KanbanBoard 
            board={filteredBoard} 
            onUpdate={handleRefresh} 
            isMonitor={true} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Squares2X2Icon className="w-16 h-16" />
            <div>
                <p className="text-lg font-black uppercase tracking-tight">Nenhuma tarefa encontrada</p>
                <p className="text-sm font-medium">Você não possui tarefas pendentes neste quadro ou critério.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
