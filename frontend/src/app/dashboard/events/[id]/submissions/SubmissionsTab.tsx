"use client";

import { useEffect, useState } from "react";
import { 
  DocumentTextIcon, 
  FunnelIcon, 
  UserGroupIcon, 
  TrashIcon, 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  TagIcon,
  BookOpenIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { Submission, SubmissionConfig } from "@/types/event";
import { User } from "@/types/auth";
import { submissionsService } from "@/services/submissions.service";
import toast from "react-hot-toast";

interface SubmissionsTabProps {
  eventId: string;
  config: SubmissionConfig | null;
}

export function SubmissionsTab({ eventId, config }: SubmissionsTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [committee, setCommittee] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModality, setFilterModality] = useState("");
  const [filterArea, setFilterArea] = useState("");

  const fetchData = async () => {
    try {
      const [list, reviewers] = await Promise.all([
        submissionsService.listSubmissionsForEvent(eventId),
        submissionsService.listEventReviewers(eventId)
      ]);
      setSubmissions(list);
      setCommittee(reviewers);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar submissões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [eventId]);

  const handleAssignReviewer = async (submissionId: string, reviewerId: string) => {
    try {
      await submissionsService.assignReview(submissionId, reviewerId);
      toast.success("Revisor atribuído!");
      fetchData();
    } catch {
      toast.error("Erro ao atribuir revisor.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await submissionsService.deleteReview(reviewId);
      toast.success("Distribuição removida!");
      fetchData();
    } catch {
      toast.error("Erro ao remover distribuição.");
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         s.author?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesModality = !filterModality || s.modalityId === filterModality;
    const matchesArea = !filterArea || s.thematicAreaId === filterArea;
    return matchesSearch && matchesModality && matchesArea;
  });

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse font-black">Carregando trabalhos...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filters */}
      <div className="premium-card p-6 bg-card border-border flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-3.5 h-3.5" /> Busca
          </label>
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Título ou Autor..." 
            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/20 focus:border-primary outline-none font-bold text-sm text-foreground" 
          />
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
             <TagIcon className="w-3.5 h-3.5" /> Modalidade
          </label>
          <select 
            value={filterModality} 
            onChange={e => setFilterModality(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-border bg-muted/20 focus:border-primary outline-none font-bold text-sm text-foreground"
          >
            <option value="">Todas</option>
            {config?.submissionModalities?.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
            <BookOpenIcon className="w-3.5 h-3.5" /> Área
          </label>
          <select 
            value={filterArea} 
            onChange={e => setFilterArea(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-border bg-muted/20 focus:border-primary outline-none font-bold text-sm text-foreground"
          >
            <option value="">Todas</option>
            {config?.thematicAreas?.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="premium-card p-12 text-center text-muted-foreground">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-bold text-sm">Nenhum trabalho encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredSubmissions.map(sub => (
            <div key={sub.id} className="premium-card p-6 bg-card border-border hover:border-primary/30 transition-all group overflow-hidden relative">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Info Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border ${
                      sub.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      sub.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {sub.status === 'SUBMITTED' ? 'Submetido' : sub.status}
                    </span>
                    <span className="text-[10px] bg-muted text-muted-foreground font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-border/50">
                      ID: {sub.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-2 leading-tight">
                    {sub.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5 underline decoration-primary/30 underline-offset-2">
                       <AcademicCapIcon className="w-3.5 h-3.5" /> {sub.author?.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <TagIcon className="w-3.5 h-3.5" /> {sub.modality?.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <BookOpenIcon className="w-3.5 h-3.5" /> {sub.thematicArea?.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                       <ClockIcon className="w-3.5 h-3.5" /> {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="w-full lg:w-80 space-y-4 lg:pl-6 lg:border-l border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                    <UserGroupIcon className="w-3 h-3" /> Revisores Atribuídos ({sub.reviews?.length || 0})
                  </p>
                  
                  <div className="space-y-2">
                    {sub.reviews?.map(rev => (
                      <div key={rev.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-xl border border-border/50 group/rev">
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-2 h-2 rounded-full ${rev.score ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs font-black text-foreground truncate">{rev.reviewer?.name}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 opacity-0 group-hover/rev:opacity-100 transition-all shrink-0"
                          title="Remover Revisor"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add Reviewer Selection */}
                    <div className="pt-2">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) handleAssignReviewer(sub.id, e.target.value);
                          e.target.value = "";
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-card hover:border-primary outline-none font-bold text-xs text-muted-foreground cursor-pointer transition-all"
                      >
                        <option value="">+ Adicionar Revisor</option>
                        {committee
                          .filter(rev => !sub.reviews?.some(r => r.reviewer?.id === rev.id))
                          .map(rev => (
                            <option key={rev.id} value={rev.id}>{rev.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
