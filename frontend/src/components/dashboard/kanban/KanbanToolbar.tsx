"use client";

import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  UserCircleIcon,
  FlagIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { KanbanFilters, WorkloadMember } from "@/types/kanban";

interface KanbanToolbarProps {
  filters: KanbanFilters;
  onFiltersChange: (filters: KanbanFilters) => void;
  members: WorkloadMember[];
  isGlobalView: boolean;
  onGlobalViewChange: (value: boolean) => void;
}

export function KanbanToolbar({ 
  filters, 
  onFiltersChange, 
  members, 
  isGlobalView, 
  onGlobalViewChange 
}: KanbanToolbarProps) {
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      memberId: null,
      priorities: [],
      onlyOverdue: false
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) + 
    (filters.memberId ? 1 : 0) + 
    (filters.priorities.length) + 
    (filters.onlyOverdue ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 bg-card/50 p-4 rounded-2xl border border-border backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearch}
            placeholder="Buscar tarefas..."
            className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>

        {/* Member Selector */}
        <div className="relative flex items-center gap-2">
          <div className="p-2.5 bg-muted/50 border border-border rounded-xl flex items-center gap-2 min-w-[160px]">
            <UserCircleIcon className="w-4 h-4 text-primary" />
            <select
              value={filters.memberId || ""}
              onChange={(e) => onFiltersChange({ ...filters, memberId: e.target.value || null })}
              className="bg-transparent text-xs font-bold uppercase tracking-widest text-foreground focus:outline-none w-full appearance-none"
            >
              <option value="" className="bg-card">Todos Membros</option>
              {members.map(member => (
                <option key={member.userId} value={member.userId} className="bg-card">
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          onClick={() => onFiltersChange({ ...filters, onlyOverdue: !filters.onlyOverdue })}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
            filters.onlyOverdue 
              ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
              : 'bg-muted/50 border-border text-muted-foreground hover:border-rose-500/30'
          }`}
        >
          <ClockIcon className="w-4 h-4" /> Atrasadas
        </button>

        {/* Global View Toggle */}
        <div className="h-8 w-[1px] bg-border hidden md:block mx-1" />
        
        <button
          onClick={() => onGlobalViewChange(!isGlobalView)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
            isGlobalView 
              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' 
              : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
          }`}
        >
          <FunnelIcon className="w-4 h-4" /> Visão Global (Super Board)
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" /> Limpar ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Priorities Chips */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <FlagIcon className="w-3 h-3" /> Prioridades:
        </span>
        <div className="flex flex-wrap gap-2">
          {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => togglePriority(p)}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                filters.priorities.includes(p)
                  ? p === 'URGENT' ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/20' :
                    p === 'HIGH' ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20' :
                    p === 'MEDIUM' ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20' :
                    'bg-slate-400 border-slate-400 text-white shadow-sm shadow-slate-400/20'
                  : 'bg-muted/30 border-border text-muted-foreground hover:border-gray-400 transition-colors'
              }`}
            >
              {p === 'URGENT' ? 'Urgente' : p === 'HIGH' ? 'Alta' : p === 'MEDIUM' ? 'Média' : 'Baixa'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
