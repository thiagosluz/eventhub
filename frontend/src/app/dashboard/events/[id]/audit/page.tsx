"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { auditService, AuditLog } from "@/services/audit.service";
import toast from "react-hot-toast";
import { DataTable, type DataTableColumn } from "@/components/ui";

export default function EventAuditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditService.getLogsByEvent(id as string);
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        toast.error("Não foi possível carregar os logs de auditoria.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [id]);

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Preparando exportação...");
    try {
      const csvData = await auditService.exportLogs(id as string);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `auditoria-evento-${id}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Logs exportados com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Failed to export logs:", error);
      toast.error("Erro ao exportar logs. Tente novamente.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
      
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action.split('_')[0]));
    return Array.from(actions);
  }, [logs]);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "user",
      header: "Monitor / Organizador",
      cell: (log) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
            {log.user.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm">{log.user.name}</span>
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              {log.user.role}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Ação",
      cell: (log) => (
        <span
          className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
            log.action.includes("CREATE")
              ? "bg-emerald-500/10 text-emerald-500"
              : log.action.includes("DELETE")
                ? "bg-destructive/10 text-destructive"
                : log.action.includes("UPDATE") || log.action.includes("PATCH")
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-blue-500/10 text-blue-500"
          }`}
        >
          {log.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Recurso",
      cell: (log) => (
        <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
          <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
          {log.resource}
          <span className="text-[10px] text-muted-foreground font-mono ml-2">
            #{log.resourceId?.slice(-6)}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Data / Hora",
      cell: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">
            {new Date(log.createdAt).toLocaleDateString("pt-BR")}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {new Date(log.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-2 rounded-lg hover:bg-orange-500/10 text-muted-foreground hover:text-orange-600 transition-colors"
          aria-label="Ver detalhes do log"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-orange-600 transition-colors uppercase tracking-widest"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar ao Evento
          </button>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-orange-600" />
            Auditoria do Evento
          </h1>
          <p className="text-muted-foreground font-medium">Rastreamento completo de atividades e alterações no evento.</p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Atividades</p>
            <ClockIcon className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-3xl font-black text-foreground">{logs.length}</h3>
        </div>
        <div className="premium-card p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ações nas últimas 24h</p>
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-emerald-500">
            {logs.filter(l => new Date(l.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length}
          </h3>
        </div>
        <div className="premium-card p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Usuários Ativos</p>
            <UserIcon className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-3xl font-black text-blue-500">
            {new Set(logs.map(l => l.userId)).size}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative flex-1 min-w-[300px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por monitor, recurso ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-muted-foreground" />
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-muted/50 border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="all">Todas Ações</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || logs.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4" />
          )}
          Exportar CSV
        </button>
      </div>

      <DataTable<AuditLog>
        ariaLabel="Logs de auditoria do evento"
        data={filteredLogs}
        columns={columns}
        rowKey={(log) => log.id}
        isLoading={loading}
        emptyTitle="Nenhum log encontrado"
        emptyDescription="Ajuste os filtros ou busca para encontrar registros."
        emptyIcon={<ShieldCheckIcon className="w-6 h-6" />}
      />

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    <ShieldCheckIcon className="w-5 h-5 text-orange-500" />
                    Detalhes do Log
                  </h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">ID: {selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-muted rounded-xl transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Usuário</p>
                    <p className="font-bold text-sm">{selectedLog.user.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ação</p>
                    <p className="font-bold text-sm text-orange-600">{selectedLog.action}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data e Hora</p>
                    <p className="font-bold text-sm">{new Date(selectedLog.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Origem</p>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">{selectedLog.ip || 'Local/Unknown'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dados Enviados (Payload)</p>
                  <div className="bg-slate-950 rounded-xl p-6 overflow-auto max-h-[300px]">
                    <pre className="text-[11px] font-mono text-emerald-400">
                      {JSON.stringify(selectedLog.payload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border mt-6">
                  <p className="text-[10px] text-muted-foreground font-bold">User Agent:</p>
                  <p className="text-[10px] italic text-muted-foreground mt-1">{selectedLog.userAgent}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
