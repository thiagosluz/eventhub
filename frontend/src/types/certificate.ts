import { Event } from './event';

export interface CertificateTemplate {
  id: string;
  eventId: string;
  event?: Event;
  name: string;
  backgroundUrl: string;
  layoutConfig: {
    placeholders: Array<{
      key: string;
      x: number;
      y: number;
      fontSize?: number;
      color?: string;
      fontFamily?: 'Helvetica' | 'Helvetica-Bold';
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
