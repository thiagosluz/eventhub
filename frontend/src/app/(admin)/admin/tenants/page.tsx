"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Search, Loader2, CheckCircle2, XCircle, ShieldAlert, Ghost, Plus, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { CreateTenantModal } from "@/components/admin/CreateTenantModal";

export default function TenantsPage() {
  const { login } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Impersonation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Create Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Confirmation Modal State
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
      const res = await api.get<any>("/admin/tenants");
      setTenants(res?.data?.data || res?.data || []);
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

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

  const openImpersonateModal = async (tenant: any) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
    try {
      setIsLoadingUsers(true);
      const res = await api.get<any[]>(`/admin/tenants/${tenant.id}/users`);
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

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Inquilinos</h1>
          <p className="text-gray-400">Gerencie todos os clientes da plataforma.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Inquilino
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome do cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-4" />
            <p>Carregando Base de Inquilinos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950 text-gray-400 font-medium uppercase text-xs border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Nome / Slug</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Eventos</th>
                  <th className="px-6 py-4 text-center">Usuários</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4 text-right">Ações de Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-100">{t.name}</div>
                      <div className="text-gray-500 text-xs">{t.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{t._count?.events || 0}</td>
                    <td className="px-6 py-4 text-center font-medium">{t._count?.users || 0}</td>
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => openImpersonateModal(t)}
                          className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                          title="Impersonate (Acesso Fantasma)"
                        >
                          <Ghost className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(t.id, t.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            t.isActive 
                              ? "text-gray-400 hover:text-red-400 hover:bg-red-400/10" 
                              : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                          }`}
                          title={t.isActive ? "Desativar Inquilino" : "Reativar Inquilino"}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Impersonate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div>
                <h2 className="text-xl font-bold text-gray-100">Acesso Fantasma</h2>
                <p className="text-sm text-gray-400">{selectedTenant?.name}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {isLoadingUsers ? (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
                  <p>Buscando usuários do inquilino...</p>
                </div>
              ) : tenantUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-500">Nenhum usuário encontrado neste inquilino.</p>
              ) : (
                <div className="grid gap-2">
                  {tenantUsers.map(u => (
                    <div 
                      key={u.id}
                      className="group flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-gray-950/50 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-100 group-hover:text-cyan-400 transition-colors">{u.name}</div>
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
