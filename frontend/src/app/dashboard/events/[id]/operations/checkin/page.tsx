"use client";

import { useEffect, useState, useRef, use } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { operationsService } from "@/services/operations.service";
import { 
  ChevronLeftIcon, 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { eventsService } from "@/services/events.service";
import { Event } from "@/types/event";

import { activitiesService } from "@/services/activities.service";
import { Activity } from "@/types/event";

export default function CheckinScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; submessage?: string } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Use a ref for selectedActivityId to access current value in scanner callback
  const selectedActivityIdRef = useRef(selectedActivityId);
  useEffect(() => {
    selectedActivityIdRef.current = selectedActivityId;
  }, [selectedActivityId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, activitiesData] = await Promise.all([
          eventsService.getOrganizerEventById(id),
          activitiesService.getActivitiesForEvent(id)
        ]);
        setEvent(eventData);
        setActivities(activitiesData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    const onScanSuccess = async (decodedText: string) => {
      if (isLoading) return;
      
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
    };

    const onScanFailure = (error: any) => {};

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [id, isLoading]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/events/${id}`}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-foreground">Scanner de Check-in</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary italic leading-none">{event?.name}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <QrCodeIcon className="w-6 h-6 text-primary" />
          </div>
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

      {/* Main Scanner Card */}
      <div className="w-full max-w-lg relative">
        <div className="premium-card bg-white border-border overflow-hidden shadow-2xl relative">
          <div id="reader" className="w-full h-full min-h-[400px]" />
          
          {/* Scanning Overlay Hint */}
          {!lastResult && !isLoading && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-3 animate-pulse">
                <CameraIcon className="w-4 h-4 text-white" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Posicione o código no centro</span>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Validando Ingresso...</p>
            </div>
          )}

          {/* Result Overlay */}
          {lastResult && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in zoom-in slide-in-from-bottom-8 duration-500 ${lastResult.success ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-lg`}>
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
        </div>

        {/* Status Bar */}
        <div className="mt-6 premium-card !p-4 bg-white border-border flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sistema Operacional</span>
           </div>
           <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">
              Ready to Scan
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

// Add CSS for shake animation if needed, or stick to Tailwind defaults
// For simplicity, using bounce/pulse from tailwind.
