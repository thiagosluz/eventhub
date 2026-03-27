"use client";

import { useState } from "react";
import { 
  Cog6ToothIcon, 
  CheckCircleIcon, 
  AcademicCapIcon, 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  TagIcon, 
  TrashIcon, 
  ArrowUpTrayIcon, 
  PlusIcon, 
  BookOpenIcon, 
  DocumentTextIcon 
} from "@heroicons/react/24/outline";
import { SubmissionConfig } from "@/types/event";
import { submissionsService } from "@/services/submissions.service";
import toast from "react-hot-toast";

interface ConfigTabProps {
  eventId: string;
  config: SubmissionConfig | null;
  onRefresh: () => void;
}

export function ConfigTab({ eventId, config, onRefresh }: ConfigTabProps) {
  const [saving, setSaving] = useState(false);

  // Config form state
  const [enabled, setEnabled] = useState(config?.submissionsEnabled || false);
  const [subStart, setSubStart] = useState(config?.submissionStartDate ? new Date(config.submissionStartDate).toISOString().slice(0, 16) : "");
  const [subEnd, setSubEnd] = useState(config?.submissionEndDate ? new Date(config.submissionEndDate).toISOString().slice(0, 16) : "");
  const [revStart, setRevStart] = useState(config?.reviewStartDate ? new Date(config.reviewStartDate).toISOString().slice(0, 16) : "");
  const [revEnd, setRevEnd] = useState(config?.reviewEndDate ? new Date(config.reviewEndDate).toISOString().slice(0, 16) : "");
  const [committeeHead, setCommitteeHead] = useState(config?.scientificCommitteeHead || "");
  const [committeeEmail, setCommitteeEmail] = useState(config?.scientificCommitteeEmail || "");

  // Modality form
  const [newModalityName, setNewModalityName] = useState("");
  const [newModalityDesc, setNewModalityDesc] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  // Thematic area form
  const [newAreaName, setNewAreaName] = useState("");

  // Rule form
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [ruleFile, setRuleFile] = useState<File | null>(null);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await submissionsService.updateSubmissionConfig(eventId, {
        submissionsEnabled: enabled,
        submissionStartDate: subStart || undefined,
        submissionEndDate: subEnd || undefined,
        reviewStartDate: revStart || undefined,
        reviewEndDate: revEnd || undefined,
        scientificCommitteeHead: committeeHead || undefined,
        scientificCommitteeEmail: committeeEmail || undefined,
      });
      toast.success("Configuração salva com sucesso!");
      onRefresh();
    } catch {
      toast.error("Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddModality = async () => {
    if (!newModalityName.trim()) return;
    try {
      await submissionsService.createModality(eventId, { name: newModalityName, description: newModalityDesc }, templateFile || undefined);
      setNewModalityName("");
      setNewModalityDesc("");
      setTemplateFile(null);
      toast.success("Modalidade criada!");
      onRefresh();
    } catch {
      toast.error("Erro ao criar modalidade.");
    }
  };

  const handleDeleteModality = async (modalityId: string) => {
    try {
      await submissionsService.deleteModality(eventId, modalityId);
      toast.success("Modalidade removida!");
      onRefresh();
    } catch {
      toast.error("Erro ao remover modalidade.");
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    try {
      await submissionsService.createThematicArea(eventId, { name: newAreaName });
      setNewAreaName("");
      toast.success("Área temática criada!");
      onRefresh();
    } catch {
      toast.error("Erro ao criar área temática.");
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    try {
      await submissionsService.deleteThematicArea(eventId, areaId);
      toast.success("Área temática removida!");
      onRefresh();
    } catch {
      toast.error("Erro ao remover área temática.");
    }
  };

  const handleAddRule = async () => {
    if (!newRuleTitle.trim() || !ruleFile) return;
    try {
      await submissionsService.createRule(eventId, newRuleTitle, ruleFile);
      setNewRuleTitle("");
      setRuleFile(null);
      toast.success("Regra adicionada!");
      onRefresh();
    } catch {
      toast.error("Erro ao adicionar regra.");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await submissionsService.deleteRule(eventId, ruleId);
      toast.success("Regra removida!");
      onRefresh();
    } catch {
      toast.error("Erro ao remover regra.");
    }
  };

  return (
    <div className="space-y-10">
      {/* Toggle + Identity */}
      <div className="premium-card p-8 bg-card border-border space-y-8">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Cog6ToothIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Configuração Geral</h2>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl">
          <div>
            <p className="font-black text-foreground">Módulo de Submissões</p>
            <p className="text-sm text-muted-foreground font-medium">Ativa/desativa submissão de trabalhos para participantes.</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-7" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Scientific Identity */}
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AcademicCapIcon className="w-4 h-4" /> Identidade Científica
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> Responsável pela Comissão
              </label>
              <input value={committeeHead} onChange={e => setCommitteeHead(e.target.value)} placeholder="Nome do responsável" className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1.5">
                <EnvelopeIcon className="w-3.5 h-3.5" /> E-mail da Comissão
              </label>
              <input value={committeeEmail} onChange={e => setCommitteeEmail(e.target.value)} type="email" placeholder="comissao@evento.com" className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Cronograma de Submissão
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Início das Submissões</label>
              <input type="datetime-local" value={subStart} onChange={e => setSubStart(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Término das Submissões</label>
              <input type="datetime-local" value={subEnd} onChange={e => setSubEnd(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Cronograma de Revisão
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Início das Revisões</label>
              <input type="datetime-local" value={revStart} onChange={e => setRevStart(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Término das Revisões</label>
              <input type="datetime-local" value={revEnd} onChange={e => setRevEnd(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            </div>
          </div>
        </div>

        <button onClick={handleSaveConfig} disabled={saving} className="premium-button !px-12 flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>

      {/* Modalities */}
      <div className="premium-card p-8 bg-card border-border space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <TagIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Modalidades</h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Tipos de trabalho aceitos (ex: Resumo Expandido, Artigo Completo, Banner).</p>

        {config?.submissionModalities?.map(mod => (
          <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl group">
            <div>
              <p className="font-bold text-foreground">{mod.name}</p>
              {mod.description && <p className="text-xs text-muted-foreground">{mod.description}</p>}
              {mod.templateUrl && (
                <a href={mod.templateUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">📄 Template</a>
              )}
            </div>
            <button onClick={() => handleDeleteModality(mod.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="space-y-4 p-6 bg-muted/10 rounded-2xl border border-dashed border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={newModalityName} onChange={e => setNewModalityName(e.target.value)} placeholder="Nome da modalidade" className="h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
            <input value={newModalityDesc} onChange={e => setNewModalityDesc(e.target.value)} placeholder="Descrição (opcional)" className="h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted cursor-pointer transition-all">
              <ArrowUpTrayIcon className="w-4 h-4" />
              {templateFile ? templateFile.name : "Template (opcional)"}
              <input type="file" onChange={e => setTemplateFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
            <button onClick={handleAddModality} disabled={!newModalityName.trim()} className="premium-button !py-2.5 !px-6 !text-xs flex items-center gap-2 disabled:opacity-50">
              <PlusIcon className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Thematic Areas */}
      <div className="premium-card p-8 bg-card border-border space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <BookOpenIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Áreas Temáticas</h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Eixos temáticos para categorização dos trabalhos submetidos.</p>

        <div className="flex flex-wrap gap-3">
          {config?.thematicAreas?.map(area => (
            <div key={area.id} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold group">
              {area.name}
              <button onClick={() => handleDeleteArea(area.id)} className="p-0.5 rounded-full hover:bg-primary hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <input value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="Nome da área temática" className="flex-1 h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
          <button onClick={handleAddArea} disabled={!newAreaName.trim()} className="premium-button !py-2.5 !px-6 !text-xs flex items-center gap-2 disabled:opacity-50">
            <PlusIcon className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      {/* Submission Rules */}
      <div className="premium-card p-8 bg-card border-border space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <DocumentTextIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Repositório de Regras</h2>
        </div>
        <p className="text-sm text-muted-foreground font-medium">PDFs com diretrizes para autores e critérios de avaliação.</p>

        {config?.submissionRules?.map(rule => (
          <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">{rule.title}</p>
                <a href={rule.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">Baixar PDF</a>
              </div>
            </div>
            <button onClick={() => handleDeleteRule(rule.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="flex items-center gap-4 p-6 bg-muted/10 rounded-2xl border border-dashed border-border">
          <input value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)} placeholder="Título do documento" className="flex-1 h-12 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm text-foreground" />
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted cursor-pointer transition-all shrink-0">
            <ArrowUpTrayIcon className="w-4 h-4" />
            {ruleFile ? ruleFile.name : "Escolher PDF"}
            <input type="file" accept="application/pdf" onChange={e => setRuleFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <button onClick={handleAddRule} disabled={!newRuleTitle.trim() || !ruleFile} className="premium-button !py-2.5 !px-6 !text-xs flex items-center gap-2 disabled:opacity-50 shrink-0">
            <PlusIcon className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
