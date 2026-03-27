"use client";

import { useEffect, useState, use } from "react";
import { submissionsService } from "@/services/submissions.service";
import { SubmissionConfig } from "@/types/event";
import {
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  TagIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import toast from "react-hot-toast";

import { ConfigTab } from "./ConfigTab";
import { CommitteeTab } from "./CommitteeTab";
import { SubmissionsTab } from "./SubmissionsTab";

type Tab = "config" | "committee" | "submissions";

export default function SubmissionConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const [config, setConfig] = useState<SubmissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState<Tab>("config");

  const fetchConfig = async () => {
    try {
      const data = await submissionsService.getSubmissionConfig(eventId);
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, [eventId]);

  const tabs = [
    { id: "config", name: "Configuração", icon: Cog6ToothIcon },
    { id: "committee", name: "Comitê Científico", icon: AcademicCapIcon },
    { id: "submissions", name: "Gestão de Trabalhos", icon: DocumentTextIcon },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando módulo científico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Submissões Científicas</h1>
          <p className="text-muted-foreground font-medium mt-1">Gerencie o comitê, submissões e avaliações deste evento.</p>
        </div>
        <Link href={`/dashboard/events/${eventId}`} className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
          ← Voltar
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border p-1 bg-muted/20 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                isActive 
                  ? "bg-card text-primary shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "config" && (
          <ConfigTab eventId={eventId} config={config} onRefresh={fetchConfig} />
        )}
        {activeTab === "committee" && (
          <CommitteeTab eventId={eventId} />
        )}
        {activeTab === "submissions" && (
          <SubmissionsTab eventId={eventId} config={config} />
        )}
      </div>
    </div>
  );
}
