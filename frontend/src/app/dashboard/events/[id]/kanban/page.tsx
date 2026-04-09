"use client";

import { use, useEffect, useState } from "react";
import { kanbanService } from "@/services/kanban.service";
import { 
  ChevronLeftIcon, 
  ViewColumnsIcon, 
  ClockIcon, 
  ChartBarIcon, 
  UsersIcon,
  SparklesIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { KanbanBoard } from "@/components/dashboard/kanban/KanbanBoard";
import { GanttView } from "@/components/dashboard/kanban/GanttView";
import { WorkloadSidebar } from "@/components/dashboard/kanban/WorkloadSidebar";
import { BoardSelector } from "@/components/dashboard/kanban/BoardSelector";
import { ColumnManagerModal } from "@/components/dashboard/kanban/ColumnManagerModal";
import { KanbanToolbar } from "@/components/dashboard/kanban/KanbanToolbar";
import { KanbanFilters, KanbanBoard as IKanbanBoard, WorkloadMember } from "@/types/kanban";
import toast from "react-hot-toast";
import { useCallback } from "react";
import { mergeBoardsToGlobal, filterTasks } from "@/utils/kanban-logic";

type ViewMode = "KANBAN" | "GANTT";

export default function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [boards, setBoards] = useState<any[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("KANBAN");
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [showWorkload, setShowWorkload] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [teamMembers, setTeamMembers] = useState<WorkloadMember[]>([]);
  const [filters, setFilters] = useState<KanbanFilters>({
    search: "",
    memberId: null,
    priorities: [],
    onlyOverdue: false
  });
  const [isFiltersHydrated, setIsFiltersHydrated] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await kanbanService.getBoards(eventId);
      setBoards(data);
      if (data.length > 0 && (!activeBoardId || !data.find((b: any) => b.id === activeBoardId))) {
        setActiveBoardId(data[0].id);
      }
    } catch {
      toast.error("Erro ao carregar quadros.");
    } finally {
      setLoading(false);
    }
  }, [eventId, activeBoardId]);

  const fetchBoardDetails = useCallback(async (boardId: string) => {
    try {
      const data = await kanbanService.getBoardDetails(boardId);
      setBoard(data);
    } catch {
      toast.error("Erro ao carregar o quadro.");
    }
  }, []);

  const fetchGlobalBoard = useCallback(async () => {
    if (boards.length === 0) return;
    try {
      setLoading(true);
      const allBoardsData = await Promise.all(
        boards.map(b => kanbanService.getBoardDetails(b.id))
      );
      
      const mergedColumns = mergeBoardsToGlobal(allBoardsData);
      
      const mergedBoard: IKanbanBoard = {
        id: "global",
        name: "Visão Global",
        eventId,
        columns: mergedColumns
      };

      setBoard(mergedBoard);
    } catch {
      toast.error("Erro ao carregar visão global.");
    } finally {
      setLoading(false);
    }
  }, [boards, eventId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Load filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`kanban_filters_${eventId}`);
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    setIsFiltersHydrated(true);
  }, [eventId]);

  // Save filters to localStorage
  useEffect(() => {
    if (isFiltersHydrated) {
      localStorage.setItem(`kanban_filters_${eventId}`, JSON.stringify(filters));
    }
  }, [filters, eventId, isFiltersHydrated]);

  useEffect(() => {
    if (activeBoardId && !isGlobalView) {
      fetchBoardDetails(activeBoardId);
    }
  }, [activeBoardId, isGlobalView, fetchBoardDetails]);

  useEffect(() => {
    if (isGlobalView) {
      fetchGlobalBoard();
    }
  }, [isGlobalView, fetchGlobalBoard]);

  useEffect(() => {
    if (eventId) {
      kanbanService.getWorkload(eventId).then(data => setTeamMembers(data as WorkloadMember[]));
    }
  }, [eventId]);

  const handleRefresh = () => {
    if (isGlobalView) {
      fetchGlobalBoard();
    } else if (activeBoardId) {
      fetchBoardDetails(activeBoardId);
    }
    fetchBoards();
  };

  // 4. Filtering Logic
  const filteredBoard = board ? {
    ...board,
    columns: board.columns.map((col: any) => ({
      ...col,
      tasks: filterTasks(col.tasks, filters)
    }))
  } : null;

  if (loading && boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse text-xs uppercase tracking-widest">Sincronizando Quadros...</p>
      </div>
    );
  }

  if (boards.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
          <ChartBarIcon className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight">Ops! Quadro não encontrado</h2>
          <p className="text-muted-foreground font-medium text-sm">Não foi possível carregar ou inicializar os quadros de tarefas deste evento.</p>
        </div>
        <button 
          onClick={fetchBoards}
          className="premium-button !py-3 !px-8 text-xs font-black uppercase tracking-widest"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 flex flex-col h-[calc(100vh-120px)] ${isHighPriority ? 'high-priority-mode' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-1">
        <div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/events/${eventId}`} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Gestão de Operação
              {isHighPriority && (
                <span className="animate-pulse flex items-center gap-2 bg-rose-500 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black">
                  <SparklesIcon className="w-3 h-3" /> Modo Alta Prioridade
                </span>
              )}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-10">
            Quadro Kanban Inteligente
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="bg-muted p-1 rounded-xl flex items-center border border-border">
            <button 
              onClick={() => setViewMode("KANBAN")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "KANBAN" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ViewColumnsIcon className="w-4 h-4" /> Quadro
            </button>
            <button 
              onClick={() => setViewMode("GANTT")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "GANTT" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <CalendarDaysIcon className="w-4 h-4" /> Timeline
            </button>
          </div>

          <div className="h-8 w-[1px] bg-border mx-2" />

          <button 
            onClick={() => setShowColumnManager(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title="Gerenciar Colunas"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" /> Colunas
          </button>

          <button 
            onClick={() => setShowWorkload(!showWorkload)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${showWorkload ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
          >
            <UsersIcon className="w-4 h-4" /> Equipe
          </button>

          {viewMode === "GANTT" && boards.length > 1 && (
            <button 
              onClick={() => setIsGlobalView(!isGlobalView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${isGlobalView ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
              title="Ver todos os quadros na timeline"
            >
              <Squares2X2Icon className="w-4 h-4" /> Todos
            </button>
          )}

          <button 
            onClick={() => setIsHighPriority(!isHighPriority)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${isHighPriority ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-card border-border text-muted-foreground hover:border-rose-500/50 hover:text-rose-500'}`}
          >
            <ClockIcon className="w-4 h-4" /> {isHighPriority ? 'Normal' : 'Operação'}
          </button>
        </div>
      </div>

      {/* Board Selector & Toolbar */}
      <div className="shrink-0 px-1 space-y-4">
        {!isGlobalView && (
          <BoardSelector
            boards={boards}
            activeBoardId={activeBoardId}
            eventId={eventId}
            onBoardSelect={(id) => setActiveBoardId(id)}
            onBoardsChange={fetchBoards}
          />
        )}
        
        <KanbanToolbar 
          filters={filters}
          onFiltersChange={setFilters}
          members={teamMembers}
          isGlobalView={isGlobalView}
          onGlobalViewChange={setIsGlobalView}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          {viewMode === "KANBAN" ? (
            filteredBoard ? (
              <KanbanBoard 
                board={filteredBoard} 
                onUpdate={handleRefresh} 
                isHighPriority={isHighPriority} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )
          ) : (
            <GanttView board={board} />
          )}
        </div>

        {showWorkload && (
          <div className="w-80 shrink-0 animate-in slide-in-from-right duration-300">
            <WorkloadSidebar eventId={eventId} />
          </div>
        )}
      </div>

      {/* Column Manager Modal */}
      {board && (
        <ColumnManagerModal
          isOpen={showColumnManager}
          onClose={() => setShowColumnManager(false)}
          boardId={board.id}
          columns={board.columns || []}
          onUpdate={handleRefresh}
        />
      )}


    </div>
  );
}
