"use client";

import { useEffect, useState } from "react";
import { 
  UsersIcon, 
  PlusIcon, 
  TrashIcon, 
  UserPlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import { User } from "@/types/auth";
import { submissionsService } from "@/services/submissions.service";
import { usersService } from "@/services/users.service";
import toast from "react-hot-toast";
import Image from "next/image";

interface CommitteeTabProps {
  eventId: string;
}

export function CommitteeTab({ eventId }: CommitteeTabProps) {
  const [committee, setCommittee] = useState<User[]>([]);
  const [allReviewers, setAllReviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isInviting, setIsInviting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [manualData, setManualData] = useState({ name: "", email: "", tempPassword: "" });

  const fetchData = async () => {
    try {
      const [currentCommittee, tenantUsers] = await Promise.all([
        submissionsService.listEventReviewers(eventId),
        usersService.getUsers()
      ]);
      setCommittee(currentCommittee);
      // Filter only users with REVIEWER role who are NOT already in the committee
      const committeeIds = new Set(currentCommittee.map(u => u.id));
      setAllReviewers(tenantUsers.filter(u => u.role === "REVIEWER" && !committeeIds.has(u.id)));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do comitê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [eventId]);

  const handleAddReviewer = async (userId: string) => {
    try {
      await submissionsService.addReviewerToEvent(eventId, userId);
      toast.success("Revisor adicionado ao comitê!");
      fetchData();
    } catch {
      toast.error("Erro ao adicionar revisor.");
    }
  };

  const handleRemoveReviewer = async (userId: string) => {
    try {
      await submissionsService.removeReviewerFromEvent(eventId, userId);
      toast.success("Revisor removido do comitê!");
      fetchData();
    } catch {
      toast.error("Erro ao remover revisor.");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submissionsService.inviteReviewer(eventId, inviteEmail);
      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
      setIsInviting(false);
    } catch {
      toast.error("Erro ao enviar convite.");
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submissionsService.manualRegisterReviewer(eventId, {
        name: manualData.name,
        email: manualData.email,
        temporaryPassword: manualData.tempPassword
      });
      toast.success("Revisor cadastrado e adicionado!");
      setManualData({ name: "", email: "", tempPassword: "" });
      setIsRegistering(false);
      fetchData();
    } catch {
      toast.error("Erro ao cadastrar revisor.");
    }
  };

  const filteredAvailable = allReviewers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold">Carregando comitê...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Actions */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => { setIsInviting(!isInviting); setIsRegistering(false); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${isInviting ? 'bg-primary text-white shadow-lg' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
        >
          <EnvelopeIcon className="w-4 h-4" /> Convidar Revisor
        </button>
        <button 
          onClick={() => { setIsRegistering(!isRegistering); setIsInviting(false); }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${isRegistering ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
        >
          <UserPlusIcon className="w-4 h-4" /> Cadastrar Manualmente
        </button>
      </div>

      {/* Forms Area */}
      {(isInviting || isRegistering) && (
        <div className="premium-card p-6 bg-muted/20 border-primary/20 border animate-in zoom-in-95 duration-200">
          {isInviting ? (
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">E-mail do Revisor</label>
                <input 
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                />
              </div>
              <button type="submit" className="h-11 px-6 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">
                Enviar Convite
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-1">Nome Completo</label>
                <input 
                  required
                  value={manualData.name}
                  onChange={e => setManualData({...manualData, name: e.target.value})}
                  placeholder="Nome do revisor"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card focus:border-indigo-600 outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-1">E-mail</label>
                <input 
                  required
                  type="email"
                  value={manualData.email}
                  onChange={e => setManualData({...manualData, email: e.target.value})}
                  placeholder="E-mail"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card focus:border-indigo-600 outline-none font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-1">Senha Temporária</label>
                <input 
                  required
                  type="password"
                  value={manualData.tempPassword}
                  onChange={e => setManualData({...manualData, tempPassword: e.target.value})}
                  placeholder="******"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-card focus:border-indigo-600 outline-none font-bold text-sm"
                />
              </div>
              <button type="submit" className="h-11 px-6 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">
                Finalizar Cadastro
              </button>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Current Committee */}
        <div className="premium-card p-8 bg-card border-border space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <UsersIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Comitê Científico</h2>
          </div>

          {committee.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl">
              <UserPlusIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium text-sm">Nenhum revisor no comitê deste evento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {committee.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl group transition-all hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-primary font-black text-xs">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <EnvelopeIcon className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveReviewer(user.id)}
                    className="p-2 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title="Remover do Comitê"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Reviewers */}
        <div className="premium-card p-8 bg-card border-border space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <PlusIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Adicionar do Tenant</h2>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar revisores cadastrados..." 
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-muted/20 focus:border-primary outline-none font-bold text-sm text-foreground" 
            />
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAvailable.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground font-medium">
                {search ? "Nenhum revisor disponível com esse nome." : "Não há outros revisores no tenant para adicionar."}
              </p>
            ) : (
              filteredAvailable.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-muted/10 border border-transparent rounded-2xl hover:bg-muted/30 hover:border-border transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.name} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-muted-foreground font-black text-xs">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddReviewer(user.id)}
                    className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Adicionar ao Comitê"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
