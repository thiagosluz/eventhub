"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  EllipsisHorizontalIcon,
  FunnelIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { EditUserModal } from "@/components/admin/EditUserModal";
import { DataTable, type DataTableColumn } from "@/components/ui";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  tenant?: { id: string; name: string } | null;
}

interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 20;

export default function GlobalUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<PaginatedUsers>("/admin/users", {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          role: roleFilter || undefined,
        },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "user",
      header: "Usuário / Identidade",
      cell: (u) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-foreground">{u.name}</div>
            <div className="text-muted-foreground text-xs flex items-center gap-1.5 font-medium">
              <EnvelopeIcon className="w-3 h-3" />
              {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Organização",
      cell: (u) =>
        u.tenant ? (
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BuildingOffice2Icon className="w-4 h-4 text-primary" />
            {u.tenant.name}
          </div>
        ) : (
          <span className="text-[10px] uppercase text-muted-foreground tracking-tighter italic">
            Sem organização
          </span>
        ),
    },
    {
      key: "role",
      header: "Papel",
      cell: (u) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
            u.role === "SUPER_ADMIN"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : u.role === "ORGANIZER"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Cadastro",
      cell: (u) => (
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-tighter">
          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      align: "right",
      cell: (u) => (
        <button
          onClick={() => openEditModal(u)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all active:scale-90"
          aria-label={`Editar ${u.name}`}
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary" />
            Gestão Global de Usuários
          </h1>
          <p className="text-muted-foreground font-medium">
            Controle de acesso e identidade em toda a plataforma.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-2xl">
        <div className="relative md:col-span-2">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/30 border border-border text-foreground placeholder-muted-foreground rounded-xl pl-12 pr-4 h-12 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          />
        </div>

        <div className="relative">
          <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-muted/30 border border-border text-foreground rounded-xl pl-12 pr-4 h-12 focus:outline-none focus:border-primary transition-all font-medium appearance-none"
          >
            <option value="">Todos os Papéis</option>
            <option value="PARTICIPANT">Participantes</option>
            <option value="SPEAKER">Palestrantes</option>
            <option value="REVIEWER">Revisores</option>
            <option value="ORGANIZER">Organizadores</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold text-sm">
          <FunnelIcon className="w-4 h-4" />
          {total} registros
        </div>
      </div>

      <DataTable<AdminUser>
        ariaLabel="Usuários globais"
        data={users}
        columns={columns}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Tente ajustar os filtros ou a busca."
        emptyIcon={<UsersIcon className="w-6 h-6" />}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
