"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { operationsService } from "@/services/operations.service";
import { 
  ChevronLeftIcon, 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  UserIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";

import { activitiesService } from "@/services/activities.service";
import { Activity } from "@/types/event";
import { analyticsService, Participant } from "@/services/analytics.service";

import { useAuth } from "@/context/AuthContext";

export function CheckinScanner({ eventId, backUrl }: { eventId: string; backUrl?: string }) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; submessage?: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // New states for manual check-in
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetchingParticipants, setIsFetchingParticipants] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isLoadingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const selectedActivityIdRef = useRef(selectedActivityId);

  // Sync ref with state
  useEffect(() => {
    selectedActivityIdRef.current = selectedActivityId;
  }, [selectedActivityId]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const onScanSuccess = useCallback(async (decodedText: string) => {
    if (isLoadingRef.current) return;
    
    setIsLoading(true);
    try {
      const result = await operationsService.checkin(decodedText, selectedActivityIdRef.current || undefined);
      if (result.alreadyCheckedIn) {
        setLastResult({ 
          success: false, 
          message: "Já Realizado", 
          submessage: "Este participante já fez o check-in." 
        });
      } else {
        setLastResult({ 
          success: true, 
          message: "Check-in Sucesso!", 
          submessage: selectedActivityIdRef.current ? "Presença confirmada na atividade." : "Bem-vindo ao evento!" 
        });
      }
    } catch (error: any) {
      setLastResult({ 
        success: false, 
        message: "Erro no Check-in", 
        submessage: error.message || "Ingresso inválido ou expirado." 
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (isTransitioningRef.current) return;
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        isTransitioningRef.current = true;
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      } finally {
        isTransitioningRef.current = false;
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isTransitioningRef.current) return;
    if (activeTab !== 'scanner') return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    if (scannerRef.current.isScanning) {
      await stopScanner();
    }

    try {
      isTransitioningRef.current = true;
      setHasError(false);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setHasError(true);
      setIsScanning(false);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [onScanSuccess, stopScanner, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Here we attempt to fetch event data. For monitors, they might not have access to getOrganizerEventById.
        // But let's keep getOrganizerEventById for now. If we get 403, we could just catch it and maybe fall back 
        // to a simpler name fetch if needed. We'll leave it as is, or we could change to a standard event endpoint if we had one.
        const [eventData, activitiesData] = await Promise.all([
          eventsService.getOrganizerEventById(eventId)
            .catch(() => ({ name: "Evento Monitorado" } as unknown as Event)), // Minimal fallback for monitors if 403 happens
          activitiesService.getActivitiesForEvent(eventId)
        ]);
        setEvent(eventData as Event);
        setActivities(activitiesData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    if (activeTab === 'scanner') {
      startScanner();
    } else {
      stopScanner();
      // Fetch participants for manual mode if not already fetched
      if (participants.length === 0) {
        setIsFetchingParticipants(true);
        analyticsService.getEventParticipants(eventId)
          .then(setParticipants)
          .catch(console.error)
          .finally(() => setIsFetchingParticipants(false));
      }
    }

    return () => {
      stopScanner();
    };
  }, [eventId, activeTab, startScanner, stopScanner, participants.length]);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) return participants.slice(0, 10); // Show only top 10 if no search
    const query = searchQuery.toLowerCase();
    return participants.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.email.toLowerCase().includes(query) ||
      p.qrCodeToken?.toLowerCase().includes(query)
    ).slice(0, 20); // Limit to 20 results for performance
  }, [participants, searchQuery]);

  const handleManualCheckin = async (participant: Participant) => {
    if (!participant.qrCodeToken) return;
    
    setIsLoading(true);
    try {
      const result = await operationsService.checkin(participant.qrCodeToken, selectedActivityIdRef.current || undefined);
      
      // Update local state for immediate feedback
      setParticipants(prev => prev.map(p => {
        if (p.id === participant.id) {
          const newAttendance = { id: result.attendanceId, activityId: selectedActivityIdRef.current || null };
          return {
            ...p,
            attendances: [...p.attendances, newAttendance]
          };
        }
        return p;
      }));

      if (result.alreadyCheckedIn) {
        setLastResult({ 
          success: false, 
          message: "Já Realizado", 
          submessage: "Este participante já fez o check-in." 
        });
      } else {
        setLastResult({ 
          success: true, 
          message: "Check-in Sucesso!", 
          submessage: selectedActivityIdRef.current ? "Presença confirmada na atividade." : "Bem-vindo ao evento!" 
        });
      }
    } catch (error: any) {
      setLastResult({ 
        success: false, 
        message: "Erro no Check-in", 
        submessage: error.message || "Ingresso inválido ou expirado." 
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  };

  const handleUndoCheckin = async (participant: Participant, attendanceId: string) => {
    setIsLoading(true);
    try {
      await operationsService.undoCheckin(attendanceId);
      
      // Update local state
      setParticipants(prev => prev.map(p => {
        if (p.id === participant.id) {
          return {
            ...p,
            attendances: p.attendances.filter(a => a.id !== attendanceId)
          };
        }
        return p;
      }));

      setLastResult({ 
        success: true, 
        message: "Desfeito!", 
        submessage: "O check-in foi removido com sucesso." 
      });
    } catch (error: any) {
      setLastResult({ 
        success: false, 
        message: "Erro ao Desfazer", 
        submessage: error.message || "Não foi possível reverter o check-in." 
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backUrl && (
              <Link 
                href={backUrl}
                className="p-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Link>
            )}
            <div>
              <h1 className="text-xl font-black text-foreground">Sistema de Check-in</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary italic leading-none">{event?.name}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <QrCodeIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl border border-border/50">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'scanner' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            Scanner QR
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'manual' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            Manual / Busca
          </button>
        </div>

        {/* Activity Selector */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 block mb-2">Modo de Check-in</label>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-border bg-slate-50 focus:border-primary outline-none font-bold text-sm appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="">Check-in Geral do Evento</option>
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-lg relative">
        {activeTab === 'scanner' ? (
          <div className="premium-card bg-white border-border overflow-hidden shadow-2xl relative">
            <div id="reader" className="w-full h-full min-h-[400px] bg-slate-100" />
            
            {hasError && (
               <div className="absolute inset-0 bg-slate-100 z-10 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground">Falha na Câmera</h3>
                    <p className="text-xs text-muted-foreground font-medium">Verifique as permissões de acesso à câmera no seu navegador.</p>
                  </div>
                  <button 
                    onClick={startScanner}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    RECONECTAR CÂMERA
                  </button>
               </div>
            )}

            {!lastResult && !isLoading && isScanning && (
              <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-3 animate-pulse">
                  <CameraIcon className="w-4 h-4 text-white" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">Posicione o código no centro</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="premium-card bg-white border-border shadow-2xl p-6 space-y-6 min-h-[400px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Busque por nome, email ou ingresso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-slate-50 focus:border-primary outline-none font-bold text-sm transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 block">Resultados da Busca</label>
              
              {isFetchingParticipants ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                   <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Buscando participantes...</p>
                </div>
              ) : filteredParticipants.length > 0 ? (
                <div className="grid gap-3">
                  {filteredParticipants.map(participant => (
                    <div 
                      key={participant.id} 
                      className="group p-4 rounded-2xl border border-border bg-slate-50 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-foreground truncate">{participant.name}</h4>
                          <p className="text-[10px] font-medium text-muted-foreground truncate">{participant.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                                {participant.ticketType}
                             </span>
                             {participant.qrCodeToken && (
                               <div className="flex items-center gap-1 text-[8px] font-bold text-primary italic">
                                  <IdentificationIcon className="w-3 h-3" />
                                  {participant.qrCodeToken.substring(0, 8)}...
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0">
                        {(() => {
                          const attendance = participant.attendances.find(a => a.activityId === (selectedActivityId || null));
                          if (attendance) {
                            return (
                              <button
                                onClick={() => handleUndoCheckin(participant, attendance.id)}
                                disabled={isLoading}
                                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/20"
                              >
                                DESFAZER
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleManualCheckin(participant)}
                              disabled={!participant.qrCodeToken || isLoading}
                              className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-emerald-500/20"
                            >
                              CHECK-IN
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  {searchQuery && filteredParticipants.length === 20 && (
                    <p className="text-center text-[10px] font-bold text-muted-foreground italic mt-2">
                      Muitos resultados... tente refinar sua busca.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                  <InformationCircleIcon className="w-12 h-12 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">Nenhum participante encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Overlays */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center space-y-4 rounded-[2rem]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Validando Ingresso...</p>
          </div>
        )}

        {/* Result Overlay */}
        {lastResult && (
          <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in zoom-in slide-in-from-bottom-8 duration-500 ${lastResult.success ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-lg rounded-[2rem]`}>
            {lastResult.success ? (
              <CheckCircleIcon className="w-24 h-24 text-white animate-bounce" />
            ) : (
              <XCircleIcon className="w-24 h-24 text-white animate-shake" />
            )}
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white">{lastResult.message}</h2>
              <p className="text-white/80 font-bold">{lastResult.submessage}</p>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-6 premium-card !p-4 bg-white border-border flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isScanning || activeTab === 'manual' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {activeTab === 'scanner' ? (isScanning ? 'Sistema Operacional' : 'Scanner Inativo') : 'Modo Manual Ativo'}
              </span>
           </div>
           <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              {activeTab === 'scanner' ? (isScanning ? 'Ready to Scan' : 'Waiting for connection') : 'Ready for Search'}
           </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-4">
        <div className="premium-card !p-4 bg-white/50 border-border border-dashed flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
             <InformationCircleIcon className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground leading-tight">Certifique-se que o local esteja bem iluminado.</p>
        </div>
        <div className="premium-card !p-4 bg-white/50 border-border border-dashed flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
             <ExclamationTriangleIcon className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground leading-tight">Mantenha o celular estável durante a leitura.</p>
        </div>
      </div>
    </div>
  );
}
