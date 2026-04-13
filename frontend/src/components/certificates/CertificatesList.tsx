"use client";

import { useEffect, useState, useMemo } from "react";
import { certificatesService } from "@/services/certificates.service";
import { IssuedCertificate } from "@/types/certificate";
import { 
  AcademicCapIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentTextIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";

type CategoryFilter = 'all' | 'PARTICIPANT' | 'SPEAKER' | 'REVIEWER' | 'MONITOR';

const categoryMap = {
  PARTICIPANT: { label: "Participação", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  SPEAKER: { label: "Palestrante", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  REVIEWER: { label: "Revisor Científico", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  MONITOR: { label: "Monitoria", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

export function CertificatesList() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await certificatesService.listMyCertificates();
        setCertificates(data);
      } catch (error) {
        console.error("Failed to fetch certificates", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const filteredCertificates = useMemo(() => {
    if (filter === 'all') return certificates;
    return certificates.filter(cert => cert.template?.category === filter);
  }, [certificates, filter]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex gap-2 animate-pulse">
           {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-24 bg-muted rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="premium-card p-16 text-center space-y-6">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto">
          <AcademicCapIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Ainda não há certificados</h2>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm">Seus certificados aparecerão aqui assim que forem emitidos pelos organizadores dos eventos que você participou.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border pb-6">
         <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <FunnelIcon className="w-4 h-4" />
            Filtrar por papel:
         </div>
         <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'PARTICIPANT', label: 'Participação' },
              { id: 'SPEAKER', label: 'Palestrante' },
              { id: 'REVIEWER', label: 'Revisor' },
              { id: 'MONITOR', label: 'Monitoria' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as CategoryFilter)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === cat.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((cert) => {
          const categoryInfo = cert.template?.category ? categoryMap[cert.template.category] : null;

          return (
            <div key={cert.id} className="premium-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              {/* Category Badge Background Accent */}
              <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl opacity-10 pointer-events-none ${categoryInfo?.color.split(' ')[1].replace('text-', 'bg-')}`} />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  {categoryInfo && (
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2">{cert.template?.event?.name}</h3>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <CalendarIcon className="w-3 h-3 text-primary" />
                      {cert.template?.event?.startDate ? new Date(cert.template.event.startDate).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a 
                  href={cert.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full premium-button !py-3 !text-[10px] !font-black flex items-center justify-center gap-2 group/btn"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
                  DOWNLOAD PDF
                </a>
              </div>
            </div>
          );
        })}

        {filteredCertificates.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground font-medium italic animate-in fade-in">
             Nenhum certificado encontrado para esta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
