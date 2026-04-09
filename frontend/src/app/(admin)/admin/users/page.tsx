"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Search, 
  Loader2, 
  User as UserIcon, 
  Mail, 
  Building2, 
  Shield, 
  MoreHorizontal, 
  Filter,
  Users as UsersIcon
} from "lucide-react";
import { EditUserModal } from "@/components/admin/EditUserModal";

export default function GlobalUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res: any = await api.get("/admin/users", {
        params: {
          page,
          search: search || undefined,
          role: roleFilter || undefined,
        }
      });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, page]);

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-indigo-400" />
            Gestão Global de Usuários
          </h1>
          <p className="text-slate-400 font-medium">Controle de acesso e identidade em toda a plataforma.</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-12 pr-4 h-12 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
          />
        </div>
        
        <div className="relative">
          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white rounded-xl pl-12 pr-4 h-12 focus:outline-none focus:border-indigo-500 transition-all font-medium appearance-none"
          >
            <option value="">Todos os Papéis</option>
            <option value="USER">Usuários</option>
            <option value="MONITOR">Monitores</option>
            <option value="SPEAKER">Palestantes</option>
            <option value="ORGANIZER">Organizadores</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-sm">
          <Filter className="w-4 h-4" />
          {total} registros
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {isLoading && page === 1 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="font-bold tracking-widest uppercase text-xs">Sincronizando Diretório...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-8 py-5">Usuário / Identidade</th>
                  <th className="px-8 py-5">Organização</th>
                  <th className="px-8 py-5">Papel</th>
                  <th className="px-8 py-5">Cadastro</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{u.name}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-300 font-semibold">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        {u.tenant?.name || <span className="text-[10px] uppercase text-slate-500 tracking-tighter italic">Sem Organização</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        u.role === 'SUPER_ADMIN' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : u.role === 'ORGANIZER'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-xs font-medium uppercase tracking-tighter">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
