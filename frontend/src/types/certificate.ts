import { Event } from './event';

export interface CertificateTemplate {
  id: string;
  eventId: string;
  event?: Event;
  name: string;
  backgroundUrl: string;
  layoutConfig: {
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
  category: 'PARTICIPANT' | 'SPEAKER' | 'REVIEWER' | 'MONITOR';
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
  registrationId?: string;
  userId?: string;
  activityId?: string;
  fileUrl: string;
  issuedAt: string;
  metadata?: any;
}
