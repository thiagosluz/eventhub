"use client";

import { useEffect, useState } from "react";
import { 
  activityTypesService, 
  speakerRolesService, 
  ActivityType, 
  SpeakerRole 
} from "@/services/management.service";
import { toast } from "react-hot-toast";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";

export default function CategoriesPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [roles, setRoles] = useState<SpeakerRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newTypeName, setNewTypeName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteType, setDeleteType] = useState<'type' | 'role' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [t, r] = await Promise.all([
        activityTypesService.list(),
        speakerRolesService.list()
      ]);
      setTypes(t);
      setRoles(r);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      const created = await activityTypesService.create(newTypeName);
      setTypes([...types, created]);
      setNewTypeName("");
      toast.success("Tipo de atividade criado!");
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Este tipo já existe.");
      } else {
        toast.error("Erro ao criar tipo.");
      }
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      const created = await speakerRolesService.create(newRoleName);
      setRoles([...roles, created]);
      setNewRoleName("");
      toast.success("Papel de palestrante criado!");
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Este papel já existe.");
      } else {
        toast.error("Erro ao criar papel.");
      }
    }
  };

  const handleDeleteType = (type: ActivityType) => {
    setItemToDelete({ id: type.id, name: type.name });
    setDeleteType('type');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRole = (role: SpeakerRole) => {
    setItemToDelete({ id: role.id, name: role.name });
    setDeleteType('role');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;
    
    setIsDeleting(true);
    try {
      if (deleteType === 'type') {
        await activityTypesService.remove(itemToDelete.id);
        setTypes(types.filter(t => t.id !== itemToDelete.id));
        toast.success("Tipo de atividade excluído.");
      } else {
        await speakerRolesService.remove(itemToDelete.id);
        setRoles(roles.filter(r => r.id !== itemToDelete.id));
        toast.success("Papel de palestrante excluído.");
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Erro ao excluir. O item pode estar em uso.");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Categorias e Papéis</h1>
        <p className="text-muted-foreground font-medium mt-1">Gerencie os tipos de atividades e os papéis dos palestrantes para sua organização.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Activity Types Section */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-lg font-bold">Tipos de Atividade</h2>
            <p className="text-xs text-muted-foreground">Ex: Palestra, Workshop, Mesa Redonda</p>
          </div>
          
          <div className="p-6 space-y-6">
            <form onSubmit={handleCreateType} className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Novo tipo..."
                className="flex-1 bg-muted/50 border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button type="submit" className="p-2 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all">
                <PlusIcon className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-2">
              {types.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">Nenhum tipo cadastrado.</p>}
              {types.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl group border border-transparent hover:border-primary/20 transition-all">
                  <span className="text-sm font-medium">{type.name}</span>
                  <button 
                    onClick={() => handleDeleteType(type)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Speaker Roles Section */}
        <section className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-lg font-bold">Papéis de Palestrante</h2>
            <p className="text-xs text-muted-foreground">Ex: Painelista, Moderador, Instrutor</p>
          </div>
          
          <div className="p-6 space-y-6">
            <form onSubmit={handleCreateRole} className="flex gap-2">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Novo papel..."
                className="flex-1 bg-muted/50 border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <button type="submit" className="p-2 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all">
                <PlusIcon className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-2">
              {roles.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">Nenhum papel cadastrado.</p>}
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl group border border-transparent hover:border-primary/20 transition-all">
                  <span className="text-sm font-medium">{role.name}</span>
                  <button 
                    onClick={() => handleDeleteRole(role)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={`Excluir ${deleteType === 'type' ? 'Tipo de Atividade' : 'Papel de Palestrante'}`}
        description={`Tem certeza que deseja excluir "${itemToDelete?.name}"? Esta ação não pode ser desfeita e pode afetar itens associados.`}
      />
    </div>
  );
}
