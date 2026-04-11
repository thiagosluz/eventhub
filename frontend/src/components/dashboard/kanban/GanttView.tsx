"use client";

import { useState } from "react";
import { 
  format, 
  addDays, 
  startOfToday, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  ClockIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export function GanttView({ board }: any) {
  const [viewMode, setViewMode] = useState<"timeline" | "month">("timeline");
  const [currentDate, setCurrentDate] = useState(startOfToday());

  const tasksWithDeadline = board?.columns
    ? board.columns.flatMap((c: any) => c.tasks.map((t: any) => ({ ...t, column: c })))
    .filter((t: any) => t.deadline)
    : [];

  return (
    <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              {viewMode === "timeline" ? "Cronograma de Atividades" : "Visão Mensal"}
            </h2>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "timeline" 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bars3BottomLeftIcon className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "month" 
                  ? "bg-background text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Squares2X2Icon className="w-3.5 h-3.5" />
              Mês
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {viewMode === "month" && (
            <div className="flex items-center gap-3 mr-4">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors border border-border shadow-sm"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-foreground min-w-[120px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </span>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors border border-border shadow-sm"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" /> Ativas
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Atrasadas
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-premium relative">
        <AnimatePresence mode="wait">
          {viewMode === "timeline" ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TimelineView tasks={tasksWithDeadline} />
            </motion.div>
          ) : (
            <motion.div
              key="month"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <MonthView tasks={tasksWithDeadline} currentDate={currentDate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimelineView({ tasks }: { tasks: any[] }) {
  const days = eachDayOfInterval({
    start: addDays(startOfToday(), -7),
    end: addDays(startOfToday(), 14)
  });

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md">
        <tr>
          <th className="sticky left-0 z-20 bg-muted/80 p-4 text-left border-r border-border min-w-[300px] text-[10px] font-black uppercase tracking-widest">
            Tarefas / Responsáveis
          </th>
          {days.map(day => (
            <th key={day.toISOString()} className={`p-4 text-center border-r border-border min-w-[100px] ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
              <p className="text-[10px] font-black uppercase text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</p>
              <p className="text-lg font-black text-foreground">{format(day, "dd")}</p>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tasks.map((task: any) => (
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
  );
}

function MonthView({ tasks, currentDate }: { tasks: any[], currentDate: Date }) {
  const start = startOfWeek(startOfMonth(currentDate));
  const end = endOfWeek(endOfMonth(currentDate));
  const days = eachDayOfInterval({ start, end });
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day, idx) => {
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.deadline), day));
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[120px] p-2 border-r border-b border-border flex flex-col gap-2 transition-colors hover:bg-muted/5 ${
                !isCurrentMonth ? 'bg-muted/5 opacity-40' : ''
              } ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, "d")}
                </span>
                {isToday && (
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary text-white">Hoje</span>
                )}
              </div>
              
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] scrollbar-none">
                {dayTasks.map(task => {
                  const isPast = new Date(task.deadline) < startOfToday() && task.column.name !== "Concluído";
                  return (
                    <div 
                      key={task.id}
                      className={`px-2 py-1 rounded text-[9px] font-bold border truncate hover:scale-105 transition-transform cursor-pointer ${
                        isPast 
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
      <ClockIcon className="w-16 h-16" />
      <div>
        <p className="text-sm font-black uppercase">Nenhuma tarefa com prazo</p>
        <p className="text-xs">Defina prazos nos cards para visualizá-los aqui.</p>
      </div>
    </div>
  );
}
