"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
  NoSymbolIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { CreateTenantModal } from "@/components/admin/CreateTenantModal";
import { DataTable, type DataTableColumn } from "@/components/ui";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: { events?: number; users?: number };
}

interface PaginatedTenants {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export default function TenantsPage() {
  const { login } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "primary" | "danger";
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "primary",
  });

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<PaginatedTenants>("/admin/tenants", {
        params: { page, limit: PAGE_SIZE },
      });
      setTenants(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleStatus = (id: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? "Desativar Inquilino?" : "Ativar Inquilino?",
      description: `Tem certeza que deseja ${currentStatus ? 'DESATIVAR' : 'ATIVAR'} este inquilino? Isso afetará o acesso de todos os usuários vinculados a ele.`,
      variant: currentStatus ? "danger" : "primary",
      confirmText: currentStatus ? "Desativar" : "Ativar",
      onConfirm: async () => {
        try {
          await api.patch(`/admin/tenants/${id}/status`, { isActive: !currentStatus });
          fetchTenants();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert("Erro ao alterar status.");
        }
      }
    });
  };

  const openImpersonateModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
    try {
      setIsLoadingUsers(true);
      const res = await api.get<{ id: string; name: string; email: string; role: string }[]>(
        `/admin/tenants/${tenant.id}/users`,
      );
      setTenantUsers(res || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleImpersonateAction = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Acesso Fantasma?",
      description: "Isso irá desconectar você desta conta de Super Admin e entrar como o usuário selecionado. Você precisará se logar novamente para voltar ao painel de administração.",
      variant: "primary",
      confirmText: "Acessar Conta",
      onConfirm: async () => {
        try {
          const res = await api.patch<any>(`/admin/impersonate/${userId}`, {});
          login(res);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert("Falha ao realizar Impersonate.");
        }
      }
    });
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: "name",
      header: "Nome / Slug",
      cell: (t) => (
        <div>
          <div className="font-bold text-foreground">{t.name}</div>
          <div className="text-muted-foreground text-xs">{t.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) =>
        t.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <XCircleIcon className="w-3.5 h-3.5" />
            Bloqueado
          </span>
        ),
    },
    {
      key: "events",
      header: "Eventos",
      align: "center",
      cell: (t) => <span className="font-semibold">{t._count?.events || 0}</span>,
    },
    {
      key: "users",
      header: "Usuários",
      align: "center",
      cell: (t) => <span className="font-semibold">{t._count?.users || 0}</span>,
    },
    {
      key: "createdAt",
      header: "Criado em",
      cell: (t) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {new Date(t.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações de risco",
      align: "right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openImpersonateModal(t)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Impersonate (Acesso Fantasma)"
          >
            <NoSymbolIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleStatus(t.id, t.isActive)}
            className={`p-2 rounded-lg transition-colors ${
              t.isActive
                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
            }`}
            title={t.isActive ? "Desativar Inquilino" : "Reativar Inquilino"}
          >
            <ShieldExclamationIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Inquilinos
          </h1>
          <p className="text-muted-foreground font-medium">
            Gerencie todos os clientes da plataforma.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Inquilino
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <DataTable<Tenant>
        ariaLabel="Inquilinos"
        data={filtered}
        columns={columns}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        emptyTitle="Nenhum inquilino encontrado"
        emptyIcon={<BuildingOffice2Icon className="w-6 h-6" />}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Modal de Impersonate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Acesso Fantasma</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTenant?.name}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {isLoadingUsers ? (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <ArrowPathIcon className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
                  <p>Buscando usuários do inquilino...</p>
                </div>
              ) : tenantUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-500">Nenhum usuário encontrado neste inquilino.</p>
              ) : (
                <div className="grid gap-2">
                  {tenantUsers.map(u => (
                    <div 
                      key={u.id}
                      className="group flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-cyan-400 transition-colors">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email} • <span className="uppercase">{u.role}</span></div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleImpersonateAction(u.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Acessar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação Unificado */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      <CreateTenantModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTenants}
      />
    </div>
  );
}
