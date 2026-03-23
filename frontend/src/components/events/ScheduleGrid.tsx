"use client";

import { useState, useMemo } from "react";
import { Activity, SpeakerAssociation } from "@/types/event";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  TagIcon,
  XMarkIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface ScheduleGridProps {
  activities: Activity[];
}

export function ScheduleGrid({ activities }: ScheduleGridProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    
    // Sort activities by start time first
    const sortedActivities = [...activities].sort((a, b) => 
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    sortedActivities.forEach(activity => {
      const dateKey = new Date(activity.startAt).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items
    }));
  }, [activities]);

  const [activeTab, setActiveTab] = useState(groupedActivities[0]?.date || "");

  if (!activities || activities.length === 0) {
    return (
      <div className="premium-card p-12 text-center space-y-4 border-dashed">
        <InformationCircleIcon className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
        <p className="text-muted-foreground font-medium">Nenhuma atividade programada para este evento.</p>
      </div>
    );
  }

  const currentActivities = groupedActivities.find(g => g.date === activeTab)?.items || [];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-foreground">Programação</h2>
        <div className="w-20 h-1.5 bg-primary rounded-full" />
      </div>

      {/* Day Selector Tabs */}
      <div className="flex flex-wrap justify-center gap-2 p-1 bg-muted/30 rounded-2xl max-w-fit mx-auto">
        {groupedActivities.map((group) => (
          <button
            key={group.date}
            onClick={() => setActiveTab(group.date)}
            className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === group.date 
                ? "bg-background text-primary shadow-lg shadow-primary/10 scale-105" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {group.date}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <div className="grid gap-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentActivities.map((activity) => (
              <motion.div
                key={activity.id}
                layoutId={`activity-${activity.id}`}
                onClick={() => setSelectedActivity(activity)}
                className="premium-card p-6 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:border-primary/50 group transition-all"
              >
                <div className="flex items-center gap-4 min-w-[140px] justify-center md:justify-start">
                  <div className="text-2xl font-black text-primary">
                    {formatTime(activity.startAt)}
                  </div>
                  <div className="h-4 w-px bg-border hidden md:block" />
                  <div className="text-sm font-bold text-muted-foreground">
                    {formatTime(activity.endAt)}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black group-hover:text-primary transition-colors">
                    {activity.title}
                  </h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                    {activity.location && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {activity.location}
                      </div>
                    )}
                    {activity.type?.name && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary italic">
                        <TagIcon className="w-3.5 h-3.5" />
                        {activity.type.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex -space-x-3 overflow-hidden">
                  {activity.speakers?.slice(0, 3).map((assoc, idx) => (
                    <div key={idx} className="inline-block h-10 w-10 rounded-full ring-4 ring-background overflow-hidden bg-muted">
                      {assoc.speaker.avatarUrl ? (
                        <Image 
                          src={assoc.speaker.avatarUrl} 
                          alt={assoc.speaker.name} 
                          width={40} 
                          height={40} 
                          className="object-cover h-full w-full"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-black text-primary uppercase">
                          {assoc.speaker.name[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {(activity.speakers?.length || 0) > 3 && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full ring-4 ring-background bg-muted text-[10px] font-black text-muted-foreground">
                      +{(activity.speakers?.length || 0) - 3}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] cursor-pointer"
            />
            <motion.div 
              layoutId={`activity-${selectedActivity.id}`}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="relative p-8 md:p-12 space-y-8 max-h-[90vh] overflow-y-auto">
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="absolute top-8 right-8 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-primary italic">
                    <TagIcon className="w-4 h-4" />
                    {selectedActivity.type?.name || 'Atividade'}
                  </div>
                  <h2 className="text-4xl font-black tracking-tight leading-tight">
                    {selectedActivity.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Horário</p>
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <ClockIcon className="w-5 h-5 text-primary" />
                        {formatTime(selectedActivity.startAt)} — {formatTime(selectedActivity.endAt)}
                      </div>
                    </div>
                    {selectedActivity.location && (
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Local</p>
                        <div className="flex items-center gap-2 text-lg font-bold">
                          <MapPinIcon className="w-5 h-5 text-primary" />
                          {selectedActivity.location}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {selectedActivity.capacity && (
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vagas</p>
                        <div className="flex items-center gap-2 text-lg font-bold">
                          <UserGroupIcon className="w-5 h-5 text-primary" />
                          {selectedActivity.capacity} lugares totais
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedActivity.description && (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sobre</p>
                    <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedActivity.description}
                    </p>
                  </div>
                )}

                {selectedActivity.speakers && selectedActivity.speakers.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Palestrantes e Convidados</p>
                    <div className="grid gap-4">
                      {selectedActivity.speakers.map((assoc, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-3xl bg-muted/30 border border-border/50">
                          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                            {assoc.speaker.avatarUrl ? (
                              <Image 
                                src={assoc.speaker.avatarUrl} 
                                alt={assoc.speaker.name} 
                                width={64} 
                                height={64} 
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xl font-black text-primary">
                                {assoc.speaker.name[0]}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-lg">{assoc.speaker.name}</h4>
                              {assoc.role && (
                                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {assoc.role.name}
                                </span>
                              )}
                            </div>
                            {assoc.speaker.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                {assoc.speaker.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-6">
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="w-full premium-button !py-4 font-black"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
