import { CertificateTemplate, IssuedCertificate } from "../types/certificate";

const API_BASE_URL = "http://localhost:3000"; // Assuming backend runs on 3000

function getAuthHeader() {
  const token = localStorage.getItem("eventhub_token");
  return {
    "Authorization": `Bearer ${token}`,
  };
}

export const certificatesService = {
  async listTemplatesByEvent(eventId: string): Promise<CertificateTemplate[]> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/event/${eventId}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Falha ao carregar templates.");
    return res.json();
  },

  async createTemplate(eventId: string, data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/event/${eventId}`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Falha ao criar template.");
    return res.json();
  },

  async getTemplate(id: string): Promise<CertificateTemplate> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Falha ao carregar template.");
    return res.json();
  },

  async updateTemplate(id: string, data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/${id}`, {
      method: "PATCH",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Falha ao atualizar template.");
    return res.json();
  },

  async uploadBackground(id: string, file: File): Promise<CertificateTemplate> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/certificates/templates/${id}/background`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) throw new Error("Falha ao subir fundo.");
    return res.json();
  },

  async issueCertificate(
    templateId: string, 
    params: { registrationId?: string; userId?: string; activityId?: string }, 
    sendEmail = true
  ): Promise<{ issuedId: string; fileUrl: string }> {
    const res = await fetch(`${API_BASE_URL}/certificates/issue`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ templateId, ...params, sendEmail }),
    });
    if (!res.ok) throw new Error("Falha ao emitir certificado.");
    return res.json();
  },

  async issueBulkTemplate(templateId: string, sendEmail = true, strategy: "skip" | "overwrite" = "skip"): Promise<{ total: number; processed: number; failed: number; details: any[] }> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/${templateId}/issue-bulk`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sendEmail, strategy }),
    });
    if (!res.ok) throw new Error("Falha ao emitir certificados em massa.");
    return res.json();
  },

  async listMyCertificates(): Promise<IssuedCertificate[]> {
    const res = await fetch(`${API_BASE_URL}/certificates/my`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Falha ao carregar seus certificados.");
    return res.json();
  },
  async previewTemplate(data: { backgroundUrl: string; layoutConfig: Record<string, unknown> }): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/preview`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Falha ao gerar pré-visualização.");
    return res.blob();
  },

  async deleteTemplate(id: string, force = false, confirm?: string): Promise<void> {
    let url = `${API_BASE_URL}/certificates/templates/${id}`;
    const params = new URLSearchParams();
    if (force) params.append("force", "true");
    if (confirm) params.append("confirm", confirm);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    
    if (res.status === 409) {
      const errorData = await res.json();
      const error = new Error(errorData.message || "Conflict");
      (error as any).status = 409;
      throw error;
    }

    if (!res.ok) throw new Error("Falha ao excluir template.");
  },

  async duplicateTemplate(id: string): Promise<CertificateTemplate> {
    const res = await fetch(`${API_BASE_URL}/certificates/templates/${id}/duplicate`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error("Falha ao duplicar template.");
    return res.json();
  },
};
