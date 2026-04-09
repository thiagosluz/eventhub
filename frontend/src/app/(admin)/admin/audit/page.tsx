"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Search, Loader2, ShieldAlert, Filter, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function GlobalAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    tenantId: "",
    userId: "",
    startDate: "",
    endDate: ""
  });

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.tenantId && { tenantId: filters.tenantId }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      }).toString();

      const res = await api.get<{ data: any[], total: number }>(`/admin/audit-logs?${query}`);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Auditoria Global
          </h1>
          <p className="text-gray-400 mt-2">Visibilidade total de eventos em todos os inquilinos (Tenants).</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Inquilino (ID)</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filtro por Tenant ID..."
              value={filters.tenantId}
              onChange={(e) => setFilters(f => ({ ...f, tenantId: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Usuário / E-mail</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar usuário..."
              value={filters.userId}
              onChange={(e) => setFilters(f => ({ ...f, userId: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Data Inicial</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
           <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Data Final</label>
           <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 py-2 px-4 rounded-lg text-sm focus:outline-none focus:border-red-500/50"
            />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
            <p>Filtrando Eventos de Segurança...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-950 text-gray-400 font-medium uppercase text-xs border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Tenant / Inquilino</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Recurso / Contexto</th>
                    <th className="px-6 py-4">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        <div className="text-gray-100">{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-100">{log.user?.name || 'Sistema'}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[150px]">
                          {log.user?.email || log.userId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-300">{log.tenant?.name || 'Global / Master'}</div>
                        <div className="text-[10px] text-gray-600 font-mono">{log.tenantId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                          log.action.includes('DELETE') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          log.action.includes('UPDATE') || log.action.includes('PATCH') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          log.action.includes('POST') || log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          'bg-gray-800 text-gray-300 border-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-200">{log.resource}</div>
                        <div className="text-gray-500 text-xs font-mono">
                          {log.event?.name ? `Evento: ${log.event.name}` : `ID: ${log.resourceId || 'N/A'}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {log.ip || 'Interno'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhum registro de auditoria encontrado para estes filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950/20">
                <div className="text-xs text-gray-500">
                  Mostrando {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} de {total} registros
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="flex items-center px-4 text-sm font-medium text-gray-300">
                    Página {page} de {totalPages}
                  </div>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 border border-gray-800 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

