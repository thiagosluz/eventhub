"use client";

import { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  CalendarIcon, 
  FlagIcon, 
  UserPlusIcon, 
  TrashIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { kanbanService } from "@/services/kanban.service";
import { ConfirmModal } from "./ConfirmModal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KanbanTask, WorkloadMember } from "@/types/kanban";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: KanbanTask | null; // null means create mode
  columnId?: string;
  eventId: string;
  teamMembers: WorkloadMember[];
  onUpdate: () => void;
}

export function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  columnId, 
  eventId, 
  teamMembers, 
  onUpdate 
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanTask['priority']>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "MEDIUM");
        setDeadline(task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : "");
        setSelectedMembers(task.assignments?.map((a) => a.user.id) || []);
        fetchTaskDetails(task.id);
      } else {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setDeadline("");
        setSelectedMembers([]);
        setTaskDetails(null);
      }
    }
  }, [isOpen, task]);

  const fetchTaskDetails = async (id: string) => {
    setLoading(true);
    try {
      const details: any = await kanbanService.getTaskDetails(id);
      setTaskDetails(details);
      setSelectedMembers(details.assignments?.map((a: any) => a.user.id) || []);
    } catch {
      toast.error("Erro ao buscar detalhes da tarefa");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Título é obrigatório");

    setSaving(true);
    try {
      const data = {
        title,
        description,
        priority,
        deadline: deadline || undefined,
        columnId: task ? undefined : columnId,
      };

      let currentTaskId = task?.id;

      if (task) {
        await kanbanService.updateTask(task.id, data);
      } else {
        const newTask = await kanbanService.createTask(data as any) as KanbanTask;
        currentTaskId = newTask.id;
      }

      // Handle assignments
      if (currentTaskId) {
        const oldMembers = task?.assignments?.map((a) => a.user.id) || [];
        
        // Unassign removed members
        for (const userId of oldMembers) {
          if (!selectedMembers.includes(userId)) {
            await kanbanService.unassignTask(currentTaskId, userId);
          }
        }
        
        // Assign new members
        for (const userId of selectedMembers) {
          if (!oldMembers.includes(userId)) {
            await kanbanService.assignTask(currentTaskId, userId);
          }
        }
      }

      toast.success(task ? "Tarefa atualizada" : "Tarefa criada");
      onUpdate();
      onClose();
    } catch {
      toast.error("Erro ao salvar tarefa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await kanbanService.deleteTask(task.id);
      toast.success("Tarefa excluída");
      setShowDeleteConfirm(false);
      onUpdate();
      onClose();
    } catch {
      toast.error("Erro ao excluir tarefa");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;

    try {
      await kanbanService.addComment(task.id, comment);
      setComment("");
      fetchTaskDetails(task.id);
      onUpdate();
    } catch {
      toast.error("Erro ao adicionar comentário");
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-950/95 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden backdrop-blur-xl flex flex-col md:flex-row">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              {task ? "Editar Tarefa" : "Nova Tarefa"}
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-xl transition-colors group"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título</label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Definir palestrantes do dia 1"
                className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione detalhes sobre o que precisa ser feito..."
                rows={4}
                className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                  <FlagIcon className="w-3 h-3" /> Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as KanbanTask['priority'])}
                  className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold appearance-none"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" /> Prazo
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold flex items-center"
                />
              </div>
            </div>

            {/* Members Selection (Mobile only, sidebar on desktop) */}
            <div className="md:hidden space-y-1">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Atribuir Membros</label>
               <div className="flex flex-wrap gap-2">
                 {teamMembers.map(member => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => toggleMember(member.userId)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedMembers.includes(member.userId) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 text-gray-400'}`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
                        {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">{member.name.charAt(0)}</div>}
                      </div>
                      <span className="text-xs font-bold">{member.name}</span>
                    </button>
                 ))}
               </div>
            </div>

            <div className="flex gap-4 pt-6 mt-auto">
              {task && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all group"
                  title="Excluir Tarefa"
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (task ? "Salvar Alterações" : "Criar Tarefa")}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar: Members & Comments */}
        <div className="w-full md:w-80 bg-gray-900/30 border-l border-gray-800/50 flex flex-col min-h-0">
          
          {/* Members Selection Section */}
          <div className="hidden md:flex flex-col p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-2 mb-4">
              <UserPlusIcon className="w-4 h-4 text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Responsáveis</h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-premium">
              {teamMembers.map(member => (
                <div 
                  key={member.userId}
                  onClick={() => toggleMember(member.userId)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedMembers.includes(member.userId) ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/30'}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden">
                      {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-primary text-xs">{member.name.charAt(0)}</div>}
                    </div>
                    {selectedMembers.includes(member.userId) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-gray-950 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold truncate ${selectedMembers.includes(member.userId) ? 'text-primary' : 'text-gray-400'}`}>
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 flex flex-col p-6 min-h-0 bg-gray-950/20">
            <div className="flex items-center gap-2 mb-4">
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Comentários</h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-premium">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-muted/30 rounded-2xl" />)}
                </div>
              ) : taskDetails?.comments?.length > 0 ? (
                taskDetails.comments.map((c: { id: string, user: { name: string }, createdAt: string, content: string }) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-muted/20 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-primary uppercase">{c.user.name}</span>
                       <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                         <ClockIcon className="w-2.5 h-2.5" />
                         {format(new Date(c.createdAt), "dd/MM HH:mm")}
                       </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-bold">{c.content}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <ChatBubbleBottomCenterTextIcon className="w-10 h-10 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum comentário</p>
                </div>
              )}
            </div>

            {task && (
              <div className="mt-auto pt-4 relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escreva algo..."
                  rows={2}
                  className="w-full bg-muted/50 border border-border rounded-2xl p-3 pr-12 text-sm text-white focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-primary text-white rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Tarefa"
        message={`Excluir a tarefa "${title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir Tarefa"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
