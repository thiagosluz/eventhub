"use client";

import { useEffect, useState } from "react";
import { certificatesService } from "@/services/certificates.service";
import { IssuedCertificate } from "@/types/certificate";
import { 
  AcademicCapIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export function CertificatesList() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />
        ))}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((cert) => (
        <div key={cert.id} className="premium-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">{cert.template?.event?.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <CalendarIcon className="w-3 h-3" />
                {cert.template?.event?.startDate ? new Date(cert.template.event.startDate).toLocaleDateString() : 'TBD'}
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
      ))}
    </div>
  );
}
