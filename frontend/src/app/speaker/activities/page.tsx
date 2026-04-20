"use client";

import { useEffect, useState } from "react";
import { speakersService, ActivitySpeaker } from "@/services/speakers.service";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CloudArrowUpIcon,
  DocumentIcon,
  CheckBadgeIcon,
  LinkIcon,
  XMarkIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

interface MaterialForm {
  title: string;
  fileUrl: string;
  fileType: string;
}

const EMPTY_FORM: MaterialForm = { title: "", fileUrl: "", fileType: "SLIDES" };

export default function SpeakerActivitiesPage() {
  const [activities, setActivities] = useState<ActivitySpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [uploadModal, setUploadModal] = useState<{ activityId: string; activityTitle: string } | null>(null);
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState<{ activityId: string; materialId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Code Modal state
  const [qrCodeModal, setQrCodeModal] = useState<{ activityId: string; activityTitle: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await speakersService.getMyActivities();
      setActivities(data);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (activityId: string, activityTitle: string) => {
    setForm(EMPTY_FORM);
    setUploadModal({ activityId, activityTitle });
  };

  const closeModal = () => {
    setUploadModal(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModal) return;
    if (!form.title.trim() || !form.fileUrl.trim()) {
      toast.error("Preencha o título e a URL do material.");
      return;
    }

    setIsSaving(true);
    try {
      await speakersService.addActivityMaterial(uploadModal.activityId, {
        title: form.title,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
      });
      toast.success("Material adicionado com sucesso!");
      closeModal();
      loadActivities();
    } catch (error) {
      toast.error("Erro ao adicionar material.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    
    try {
      await speakersService.removeActivityMaterial(deleteModal.activityId, deleteModal.materialId);
      toast.success("Material removido com sucesso!");
      setDeleteModal(null);
      loadActivities();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover material.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-card rounded-3xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div>
        <h1 className="text-3xl font-black text-foreground">Minha Agenda</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas sessões, locais e envie materiais para os participantes.
        </p>
      </div>

      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-[2.5rem] p-20 text-center">
            <p className="text-muted-foreground font-bold">
              Você não tem atividades vinculadas a este evento.
            </p>
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.activityId}
              className="group bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col md:flex-row">
                {/* Left: Activity Info */}
                <div className="p-8 md:p-12 flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {item.role?.name || "Palestrante"}
                    </span>
                    <span className="bg-muted text-muted-foreground px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-border">
                      {item.activity.type?.name || "Sessão"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-primary italic">{item.activity.event.name}</p>
                    <h2 className="text-3xl font-black text-foreground group-hover:text-primary transition-colors">
                      {item.activity.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data e Hora</p>
                        <p className="text-sm font-bold">
                          {new Date(item.activity.startAt).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}{" "}
                          às{" "}
                          {new Date(item.activity.startAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Local/Sala</p>
                        <p className="text-sm font-bold">{item.activity.location || "A definir"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inscritos</p>
                        <p className="text-sm font-bold">{item.activity._count.enrollments} Participantes</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Materials Panel */}
                <div className="w-full md:w-80 bg-muted/50 border-t md:border-t-0 md:border-l border-border p-8 flex flex-col gap-6">
                  {/* Materials List */}
                  <div className="space-y-3 flex-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                      <DocumentIcon className="w-4 h-4 text-primary" />
                      Materiais ({(item.activity as any).materials?.length || 0})
                    </h4>

                    {(item.activity as any).materials?.length > 0 ? (
                      <div className="space-y-2">
                        {(item.activity as any).materials.map((mat: any) => (
                          <div key={mat.id} className="flex items-center gap-2">
                            <a
                              href={mat.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group/mat min-w-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <LinkIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span className="text-xs font-bold truncate">{mat.title}</span>
                              </div>
                              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-muted-foreground group-hover/mat:text-primary flex-shrink-0 transition-colors" />
                            </a>
                            <button
                              onClick={() => setDeleteModal({ activityId: item.activityId, materialId: mat.id })}
                              className="p-3 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors group"
                              title="Remover material"
                            >
                              <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground font-medium">
                        Nenhum material enviado ainda. Os participantes poderão baixar após a sessão.
                      </p>
                    )}
                  </div>

                  {/* Add Material Button */}
                  <button
                    onClick={() => openModal(item.activityId, item.activity.title)}
                    className="w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2 border border-primary/20"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Adicionar Material
                  </button>

                  <button
                    onClick={() => setQrCodeModal({ activityId: item.activityId, activityTitle: item.activity.title })}
                    className="w-full py-2.5 bg-background text-foreground border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    QR Code de Feedback
                  </button>

                  {/* Status Badge */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <CheckBadgeIcon className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Status</p>
                      <p className="text-xs font-bold text-emerald-700">Participação Confirmada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
            onClick={closeModal}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl z-[101] p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-foreground">Adicionar Material</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium line-clamp-1">
                  {uploadModal.activityTitle}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaterial} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Título do Material *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:border-primary focus:bg-card outline-none font-bold text-sm transition-all"
                  placeholder="Ex: Slides da Apresentação"
                  required
                />
              </div>

              {/* File Type */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Tipo de Material
                </label>
                <div className="flex gap-2">
                  {["SLIDES", "PDF", "VIDEO", "LINK"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, fileType: type })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        form.fileType === type
                          ? "bg-primary text-white border-primary"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  URL do Arquivo / Link *
                </label>
                <div className="relative">
                  <CloudArrowUpIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-muted/30 focus:border-primary focus:bg-card outline-none font-bold text-sm transition-all"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Use Google Drive, Dropbox, Notion, YouTube ou qualquer link público.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PlusIcon className="w-4 h-4" />
                  )}
                  {isSaving ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteMaterial}
        title="Remover Material"
        description="Tem certeza que deseja remover este material? Esta ação não pode ser desfeita e os participantes não terão mais acesso a ele."
        confirmText="Excluir Material"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* QR Code Modal */}
      {qrCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Feedback ao Vivo</p>
                <h3 className="text-xl font-black">{qrCodeModal.activityTitle}</h3>
              </div>
              <button
                onClick={() => setQrCodeModal(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-12 flex flex-col items-center justify-center space-y-8 bg-white">
              <div className="p-6 bg-white rounded-[2rem] shadow-2xl border border-zinc-100 ring-8 ring-zinc-50">
                <QRCodeCanvas
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${qrCodeModal.activityId}`}
                  size={280}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/logo-icon.png", // Caso exista um ícone de logo
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="w-full max-w-sm space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-xl font-black text-zinc-900">Peça para os participantes lerem o código</p>
                  <p className="text-sm text-zinc-500 font-medium">
                    Ou compartilhe o link direto para a página de avaliação.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 bg-zinc-100 rounded-2xl border border-zinc-200">
                  <div className="flex-1 px-3 overflow-hidden">
                    <p className="text-xs font-bold text-zinc-600 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/f/{qrCodeModal.activityId}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/f/${qrCodeModal.activityId}`)}
                    className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                      isCopied ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-900 shadow-sm hover:bg-zinc-50'
                    }`}
                  >
                    {isCopied ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isCopied ? 'Copiado' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-center">
              <button
                onClick={() => setQrCodeModal(null)}
                className="px-8 py-3 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
