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
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IssuedCertificate {
  id: string;
  templateId: string;
  template?: CertificateTemplate;
  registrationId: string;
  fileUrl: string;
  issuedAt: string;
}
