export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
}

export interface Ticket {
  id: string;
  eventId: string;
  event?: Event;
  registrationId: string;
  type: 'FREE' | 'PAID';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  price: number;
  qrCodeToken?: string;
  createdAt: string;
}

export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
}

export interface Submission {
  id: string;
  eventId: string;
  event?: Event;
  authorId: string;
  title: string;
  abstract?: string;
  fileUrl: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  submissionId: string;
  submission?: Submission;
  reviewerId: string;
  score?: number;
  recommendation?: string;
  comments?: string;
  createdAt: string;
}

export interface Form {
  id: string;
  name: string;
  type: 'REGISTRATION' | 'SUBMISSION';
  fields: FormField[];
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  bannerUrl?: string;
  logoUrl?: string;
  activities?: Activity[];
  tickets?: Ticket[];
  forms?: Form[];
  tenant?: Tenant;
}
