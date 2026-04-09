"use client";

import { useEffect, useState } from "react";
import { kanbanService } from "@/services/kanban.service";
import { UsersIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export function WorkloadSidebar({ eventId }: { eventId: string }) {
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kanbanService.getWorkload(eventId)
      .then(setWorkload)
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <UsersIcon className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Carga da Equipe</h3>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Monitoramento em Tempo Real</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-premium">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : workload.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <UsersIcon className="w-10 h-10 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase">Nenhum monitor escalado</p>
          </div>
        ) : (
          workload.map((user) => (
            <div key={user.userId} className="p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-border p-0.5 bg-card">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-foreground truncate">{user.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{user.taskCount} tarefas</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${user.taskCount > 5 ? 'bg-rose-500' : user.taskCount > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((user.taskCount / 8) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-muted/20 border-t border-border mt-auto">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Total Ativos</span>
          <span className="text-foreground">{workload.length} monitores</span>
        </div>
      </div>
    </div>
  );
}
