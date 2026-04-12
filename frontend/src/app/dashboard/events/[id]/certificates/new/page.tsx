"use client";

import { use } from "react";
import CertificateTemplateForm from "@/components/dashboard/CertificateTemplateForm";

export default function NewCertificateTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CertificateTemplateForm eventId={eventId} />
    </div>
  );
}
