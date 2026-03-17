"use client";

import { useEffect, useState, use } from "react";
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  ChevronLeftIcon,
  SparklesIcon,
  PhotoIcon,
  LinkIcon,
  ArrowsUpDownIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { SponsorCategory, Sponsor, sponsorsService } from "@/services/sponsors.service";

export default function SponsorsManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [categories, setCategories] = useState<SponsorCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Editing States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<SponsorCategory> | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor> | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const fetchSponsors = async () => {
    try {
      const data = await sponsorsService.listCategories(eventId);
      setCategories(data);
    } catch (err) {
      toast.error("Erro ao carregar patrocinadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [eventId]);

  // --- Category Handlers ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory?.id) {
        await sponsorsService.updateCategory(editingCategory.id, editingCategory);
        toast.success("Categoria atualizada!");
      } else {
        await sponsorsService.createCategory(eventId, editingCategory || {});
        toast.success("Categoria criada!");
      }
      setIsCategoryModalOpen(false);
      fetchSponsors();
    } catch (err) {
      toast.error("Erro ao salvar categoria.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Todos os patrocinadores nela serão removidos.")) return;
    try {
      await sponsorsService.deleteCategory(id);
      toast.success("Categoria excluída!");
      fetchSponsors();
    } catch (err) {
      toast.error("Erro ao excluir categoria.");
    }
  };

  // --- Sponsor Handlers ---
  const handleSaveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let sponsorId = editingSponsor?.id;
      if (sponsorId) {
        await sponsorsService.updateSponsor(sponsorId, editingSponsor!);
        toast.success("Patrocinador atualizado!");
      } else {
        const newSponsor = await sponsorsService.createSponsor({ 
          ...editingSponsor, 
          categoryId: targetCategoryId! 
        });
        sponsorId = newSponsor.id;
        toast.success("Patrocinador criado!");
      }
      setIsSponsorModalOpen(false);
      fetchSponsors();
    } catch (err) {
      toast.error("Erro ao salvar patrocinador.");
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm("Excluir este patrocinador?")) return;
    try {
      await sponsorsService.deleteSponsor(id);
      toast.success("Patrocinador removido!");
      fetchSponsors();
    } catch (err) {
      toast.error("Erro ao remover patrocinador.");
    }
  };

  const handleLogoUpload = async (sponsorId: string, file: File) => {
    try {
      await sponsorsService.uploadLogo(sponsorId, file);
      toast.success("Logo atualizada!");
      fetchSponsors();
    } catch (err) {
      toast.error("Erro ao subir logo.");
    }
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
         <p className="text-muted-foreground font-bold animate-pulse">Carregando parceiros...</p>
       </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
             <SparklesIcon className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Módulo de Patrocínio</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Patrocinadores & Parceiros</h1>
          <p className="text-muted-foreground font-medium">Gerencie as marcas que apoiam seu evento e suas categorias de exibição.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingCategory({}); setIsCategoryModalOpen(true); }}
            className="premium-button flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nova Categoria
          </button>
          <Link href={`/dashboard/events/${eventId}`} className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-2 px-2">
            <ChevronLeftIcon className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
         <div className="premium-card p-20 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
               <SparklesIcon className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <div>
               <h3 className="text-lg font-bold">Nenhuma categoria de patrocínio</h3>
               <p className="text-muted-foreground max-w-sm">Comece criando categorias como "Ouro", "Prata" ou "Apoio" para organizar seus parceiros.</p>
            </div>
            <button 
              onClick={() => { setEditingCategory({}); setIsCategoryModalOpen(true); }}
              className="premium-button flex items-center gap-2 mt-4"
            >
              <PlusIcon className="w-5 h-5" />
              Criar Primeira Categoria
            </button>
         </div>
      )}

      {/* Category List */}
      <div className="space-y-12">
        {categories.map((category) => (
          <div key={category.id} className="space-y-6">
            {/* Category Header */}
            <div className="flex items-center justify-between group">
               <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-12 rounded-full" 
                    style={{ backgroundColor: category.color || 'var(--primary)' }}
                  />
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                       {category.name}
                       <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border">
                          {category.size}
                       </span>
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">
                       {category.sponsors.length} patrocinador(es)
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
                    className="p-2 hover:bg-muted rounded-xl transition-all"
                  >
                     <PencilIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 hover:bg-destructive/10 rounded-xl transition-all"
                  >
                     <TrashIcon className="w-5 h-5 text-destructive" />
                  </button>
               </div>
            </div>

            {/* Sponsors Grid in Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
               {category.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="premium-card bg-card border-border p-4 group relative overflow-hidden">
                     {/* Actions Overlay */}
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                          onClick={() => { setEditingSponsor(sponsor); setIsSponsorModalOpen(true); }}
                          className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-border hover:bg-primary hover:text-white transition-all"
                        >
                           <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSponsor(sponsor.id)}
                          className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-border hover:bg-destructive hover:text-white transition-all"
                        >
                           <TrashIcon className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div className="relative aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border group/logo">
                            {sponsor.logoUrl ? (
                              <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-contain p-2" />
                            ) : (
                              <PhotoIcon className="w-8 h-8 text-muted-foreground opacity-20" />
                            )}
                            <label className="absolute inset-0 cursor-pointer bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center z-10">
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 onChange={(e) => e.target.files?.[0] && handleLogoUpload(sponsor.id, e.target.files[0])} 
                               />
                               <ArrowUpTrayIcon className="w-6 h-6 text-white" />
                            </label>
                        </div>
                        <div className="text-center px-2">
                           <p className="font-black text-xs uppercase tracking-tight truncate">{sponsor.name}</p>
                           {sponsor.websiteUrl && (
                             <a href={sponsor.websiteUrl} target="_blank" className="text-[10px] text-primary font-bold hover:underline flex items-center justify-center gap-1 mt-1">
                               <LinkIcon className="w-3 h-3" />
                               Website
                             </a>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
               
               <button 
                 onClick={() => { setEditingSponsor({}); setTargetCategoryId(category.id); setIsSponsorModalOpen(true); }}
                 className="premium-card bg-muted/50 border-dashed border-2 border-border hover:border-primary/40 p-4 flex flex-col items-center justify-center gap-2 group transition-all min-h-[160px]"
               >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                     <PlusIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Novo Parceiro</span>
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="premium-card bg-card border-border w-full max-w-lg p-8 shadow-2xl scale-in duration-200">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
              {editingCategory?.id ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome da Categoria</label>
                <input 
                  autoFocus
                  required
                  value={editingCategory?.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                  placeholder="Ex: Patrocinadores Ouro, Apoio Institucional..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Tamanho da Logo</label>
                  <select 
                    value={editingCategory?.size || "MEDIUM"}
                    onChange={(e) => setEditingCategory({ ...editingCategory, size: e.target.value as any })}
                    className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                  >
                    <option value="SMALL">Pequeno</option>
                    <option value="MEDIUM">Médio</option>
                    <option value="LARGE">Grande</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Cor Temática</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={editingCategory?.color || "#6366f1"}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-12 h-12 p-1 rounded-xl border border-border bg-card cursor-pointer"
                    />
                    <input 
                      value={editingCategory?.color || "#6366f1"}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="flex-1 h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-mono font-bold text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button type="submit" className="premium-button">
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor Modal */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="premium-card bg-card border-border w-full max-w-lg p-8 shadow-2xl scale-in duration-200">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
              {editingSponsor?.id ? "Editar Patrocinador" : "Novo Patrocinador"}
            </h2>
            <form onSubmit={handleSaveSponsor} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome da Empresa/Marca</label>
                <input 
                  autoFocus
                  required
                  value={editingSponsor?.name || ""}
                  onChange={(e) => setEditingSponsor({ ...editingSponsor, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                  placeholder="Nome do parceiro"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Website (URL)</label>
                <div className="relative">
                   <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                    value={editingSponsor?.websiteUrl || ""}
                    onChange={(e) => setEditingSponsor({ ...editingSponsor, websiteUrl: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                    placeholder="https://exemplo.com.br"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsSponsorModalOpen(false)}
                  className="px-6 py-3 rounded-xl border border-border font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button type="submit" className="premium-button">
                  Salvar Parceiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowUpTrayIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
