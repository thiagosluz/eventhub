"use client";

import { format, addDays, startOfToday, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";

export function GanttView({ board }: any) {
  const days = eachDayOfInterval({
    start: startOfToday(),
    end: addDays(startOfToday(), 14)
  });

  const tasksWithDeadline = board?.columns
    ? board.columns.flatMap((c: any) => c.tasks.map((t: any) => ({ ...t, column: c })))
    .filter((t: any) => t.deadline)
    : [];

  return (
    <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest">Cronograma de Atividades (Timeline)</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Ativas
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Atrasadas
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-premium">
        {tasksWithDeadline.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
            <ClockIcon className="w-16 h-16" />
            <div>
              <p className="text-sm font-black uppercase">Nenhuma tarefa com prazo</p>
              <p className="text-xs">Defina prazos nos cards para visualizá-los aqui.</p>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md">
              <tr>
                <th className="sticky left-0 z-20 bg-muted/80 p-4 text-left border-r border-border min-w-[300px] text-[10px] font-black uppercase tracking-widest">Tarefas / Responsáveis</th>
                {days.map(day => (
                  <th key={day.toISOString()} className={`p-4 text-center border-r border-border min-w-[100px] ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</p>
                    <p className="text-lg font-black text-foreground">{format(day, "dd")}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasksWithDeadline.map((task: any) => (
                <tr key={task.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="sticky left-0 z-20 bg-card/95 backdrop-blur-sm p-4 border-r border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-foreground line-clamp-1">{task.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {task.column.name}
                        </span>
                        <div className="flex -space-x-1">
                          {task.assignments?.map((a: any) => (
                            <div key={a.userId} className="w-4 h-4 rounded-full border border-card bg-muted overflow-hidden">
                              {a.user.avatarUrl ? <img src={a.user.avatarUrl} className="w-full h-full object-cover" /> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  {days.map(day => {
                    const isDeadline = isSameDay(new Date(task.deadline), day);
                    const isPast = new Date(task.deadline) < startOfToday() && task.column.name !== "Concluído";
                    
                    return (
                      <td key={day.toISOString()} className={`p-4 border-r border-border/50 relative ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                        {isDeadline && (
                          <div className={`absolute inset-x-2 inset-y-2 rounded-lg p-1.5 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 ${isPast ? 'bg-rose-500 shadow-rose-500/20' : 'bg-primary shadow-primary/20'}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
