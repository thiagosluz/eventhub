"use client";

import { useEffect, useState } from "react";
import { speakersService } from "@/services/speakers.service";
import { Speaker } from "@/types/event";
import { UserPlusIcon, UserIcon, PencilSquareIcon, TrashIcon, PlusIcon, LinkIcon, XMarkIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usersService } from "@/services/users.service";
import { User } from "@/types/auth";
import { toast } from "react-hot-toast";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Skeleton } from "@/components/ui";

export default function SpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState<Speaker | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<"unlink" | "delete" | null>(null);
  const [speakerActionTarget, setSpeakerActionTarget] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sData, uData] = await Promise.all([
        speakersService.getSpeakers(),
        usersService.getUsers()
      ]);
      setSpeakers(sData);
      setUsers(uData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkUser = async (userId: string) => {
    if (!isLinking) return;
    try {
      await speakersService.updateSpeaker(isLinking.id, { userId });
      toast.success("Usuário vinculado com sucesso!");
      setIsLinking(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao vincular usuário.");
    }
  };

  const handleUnlinkUser = (speakerId: string) => {
    setSpeakerActionTarget(speakerId);
    setConfirmActionType("unlink");
    setIsConfirmModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setSpeakerActionTarget(id);
    setConfirmActionType("delete");
    setIsConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!speakerActionTarget || !confirmActionType) return;

    try {
      setIsActionLoading(true);
      if (confirmActionType === "unlink") {
        await speakersService.updateSpeaker(speakerActionTarget, { userId: null });
        toast.success("Usuário desvinculado com sucesso!");
        loadData();
      } else {
        await speakersService.deleteSpeaker(speakerActionTarget);
        setSpeakers(speakers.filter(s => s.id !== speakerActionTarget));
        toast.success("Palestrante excluído.");
      }
      setIsConfirmModalOpen(false);
      setSpeakerActionTarget(null);
      setConfirmActionType(null);
    } catch (error) {
      toast.error(confirmActionType === "unlink" ? "Erro ao desvincular usuário." : "Erro ao excluir palestrante.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !speakers.some(s => s.userId === u.id)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Palestrantes
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Gerencie o banco de palestrantes e vincule-os a contas de usuários.
          </p>
        </div>
        
        <Link 
          href="/dashboard/speakers/new" 
          className="premium-button !px-6 !py-3 !text-sm !font-black inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Palestrante
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : speakers.length === 0 ? (
        <div className="premium-card p-12 bg-card border-border border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Nenhum palestrante encontrado</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Comece cadastrando palestrantes que poderão ser vinculados às atividades dos seus eventos.
            </p>
          </div>
          <Link href="/dashboard/speakers/new" className="premium-button !px-8">
            Cadastrar Primeiro Palestrante
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <div 
              key={speaker.id} 
              className="premium-card p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border-2 border-border group-hover:border-primary/20 transition-colors">
                  {speaker.avatarUrl ? (
                    <img 
                      src={speaker.avatarUrl} 
                      alt={speaker.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UserIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground truncate">
                      {speaker.name}
                    </h3>
                    {speaker.userId && (
                      <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter" title="Usuário Vinculado">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {speaker.bio || "Sem biografia cadastrada."}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border mt-6">
                {!speaker.userId ? (
                  <button 
                    onClick={() => setIsLinking(speaker)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Vincular Conta
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      <CheckBadgeIcon className="w-3.5 h-3.5" />
                      Conectado
                    </div>
                    <button 
                      onClick={() => handleUnlinkUser(speaker.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Desvincular
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/speakers/${speaker.id}/edit`}
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(speaker.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link User Modal */}
      {isLinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="text-xl font-black text-foreground">Vincular Usuário</h3>
                <p className="text-sm text-muted-foreground">Conecte o palestrante <span className="text-primary font-bold">{isLinking.name}</span> a uma conta.</p>
              </div>
              <button 
                onClick={() => setIsLinking(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-border">
              <input 
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                className="premium-input w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground italic text-sm">Nenhum usuário disponível para vínculo.</div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleLinkUser(user.id)}
                      className="w-full p-4 rounded-2xl hover:bg-primary/5 group transition-all text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                           {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-muted-foreground" />}
                         </div>
                         <div>
                           <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{user.name}</p>
                           <p className="text-xs text-muted-foreground">{user.email}</p>
                         </div>
                      </div>
                      <PlusIcon className="w-5 h-5 text-border group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteAction}
        isLoading={isActionLoading}
        title={confirmActionType === 'unlink' ? "Desvincular Usuário?" : "Excluir Palestrante?"}
        description={confirmActionType === 'unlink' 
          ? "Deseja desvincular este usuário do perfil de palestrante? O acesso dele ao portal será removido."
          : "Tem certeza que deseja excluir permanentemente este palestrante? Esta ação não pode ser desfeita."
        }
        confirmText={confirmActionType === 'unlink' ? "Desvincular" : "Excluir"}
        variant="danger"
      />
    </div>
  );
}
