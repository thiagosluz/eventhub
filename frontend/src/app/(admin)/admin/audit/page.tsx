"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  FunnelIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { DataTable, type DataTableColumn } from "@/components/ui";

interface AuditLog {
  id: string;
  createdAt: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  user?: { name?: string; email?: string } | null;
  tenant?: { name?: string } | null;
  event?: { name?: string } | null;
}

interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export default function GlobalAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    tenantId: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<PaginatedAuditLogs>("/admin/audit-logs", {
        params: {
          page,
          limit: PAGE_SIZE,
          tenantId: filters.tenantId || undefined,
          userId: filters.userId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
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

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Data/Hora",
      cell: (log) => (
        <div className="whitespace-nowrap">
          <div className="text-foreground text-sm">
            {new Date(log.createdAt).toLocaleDateString("pt-BR")}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleTimeString("pt-BR")}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "Usuário",
      cell: (log) => (
        <div>
          <div className="font-bold text-foreground">{log.user?.name || "Sistema"}</div>
          <div className="text-muted-foreground text-xs truncate max-w-[180px]">
            {log.user?.email || log.userId || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      cell: (log) => (
        <div>
          <div className="font-semibold text-foreground">
            {log.tenant?.name || "Global / Master"}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {log.tenantId || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Ação",
      cell: (log) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
            log.action.includes("DELETE")
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : log.action.includes("UPDATE") || log.action.includes("PATCH")
                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                : log.action.includes("POST") || log.action.includes("CREATE")
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Recurso / Contexto",
      cell: (log) => (
        <div>
          <div className="text-foreground">{log.resource}</div>
          <div className="text-muted-foreground text-xs font-mono">
            {log.event?.name
              ? `Evento: ${log.event.name}`
              : `ID: ${log.resourceId || "N/A"}`}
          </div>
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP",
      cell: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.ip || "Interno"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <ShieldExclamationIcon className="w-8 h-8 text-destructive" />
            Auditoria Global
          </h1>
          <p className="text-muted-foreground font-medium mt-2">
            Visibilidade total de eventos em todos os inquilinos (Tenants).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Inquilino (ID)
          </label>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtro por Tenant ID..."
              value={filters.tenantId}
              onChange={(e) => setFilters((f) => ({ ...f, tenantId: e.target.value }))}
              className="w-full bg-background border border-border text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Usuário (ID)
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
              className="w-full bg-background border border-border text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Data Inicial
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full bg-background border border-border text-foreground py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Data Final
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full bg-background border border-border text-foreground py-2 px-4 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <DataTable<AuditLog>
        ariaLabel="Logs de auditoria global"
        data={logs}
        columns={columns}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        emptyTitle="Nenhum registro"
        emptyDescription="Não há logs de auditoria para os filtros aplicados."
        emptyIcon={<ShieldExclamationIcon className="w-6 h-6" />}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
