import { Event } from './event';

export interface CertificateTemplate {
  id: string;
  eventId: string;
  event?: Event;
  name: string;
  backgroundUrl: string;
  layoutConfig: {
    placeholders?: any[]; // Deprecated
    textBlocks?: Array<{
      text: string;
      x: number;
      y: number;
      width?: number;
      fontSize?: number;
      lineHeight?: number;
      color?: string;
      align?: "left" | "center" | "right" | "justify";
    }>;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    issuedCertificates: number;
  };
}

export interface IssuedCertificate {
  id: string;
  templateId: string;
  template?: CertificateTemplate;
  registrationId: string;
  fileUrl: string;
  issuedAt: string;
}
