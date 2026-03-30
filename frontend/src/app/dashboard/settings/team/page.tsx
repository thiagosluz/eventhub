"use client";

import { useEffect, useState } from "react";
import { staffService, Organizer } from "@/services/staff.service";
import { 
  UsersIcon, 
  PlusIcon, 
  ShieldCheckIcon, 
  EnvelopeIcon, 
  KeyIcon,
  ArrowPathIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function TeamManagementPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({ email: "", name: "", temporaryPassword: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadOrganizers = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.listOrganizers();
      setOrganizers(data);
    } catch (error) {
      toast.error("Erro ao carregar equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await staffService.createOrganizer(newOrganizer);
      toast.success("Organizador cadastrado com sucesso!");
      setIsDialogOpen(false);
      setNewOrganizer({ email: "", name: "", temporaryPassword: "" });
      loadOrganizers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cadastrar organizador.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Equipe da Organização</h1>
          <p className="text-muted-foreground font-medium">Gerencie os administradores da sua conta.</p>
        </div>

        <button 
          onClick={() => setIsDialogOpen(true)}
          className="premium-button flex items-center gap-2 !px-6"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Organizador
        </button>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-xl font-bold uppercase tracking-tight">Adicionar Organizador</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newOrganizer.name}
                  onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Email Profissional</label>
                <input
                  type="email"
                  placeholder="email@empresa.com"
                  value={newOrganizer.email}
                  onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Senha Temporária</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newOrganizer.temporaryPassword}
                  onChange={(e) => setNewOrganizer({ ...newOrganizer, temporaryPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="flex-1 premium-button !py-3 !text-xs !font-black"
                >
                  {isCreating ? <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto" /> : "CADASTRAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-card/50 rounded-3xl border border-border border-dashed">
          <ArrowPathIcon className="w-12 h-12 text-primary/20 animate-spin" />
        </div>
      ) : (
        <div className="premium-card bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contato</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Função</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizers.map((org) => (
                  <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic">
                          {org.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-sm">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <EnvelopeIcon className="w-4 h-4 opacity-40" />
                        {org.email}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        ORGANIZER
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-muted-foreground uppercase italic">
                      {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {organizers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                      Nenhum administrador adicional cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
