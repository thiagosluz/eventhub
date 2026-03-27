export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Speaker {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
}

export interface ActivityType {
  id: string;
  name: string;
}

export interface SpeakerRole {
  id: string;
  name: string;
}

export interface SpeakerAssociation {
  speakerId: string;
  speaker: Speaker;
  roleId?: string;
  role?: SpeakerRole;
}

export type EnrollmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface ActivityEnrollment {
  id: string;
  activityId: string;
  registrationId: string;
  registration: {
    user: {
      id: string;
      name?: string;
      email: string;
    };
  };
  status: EnrollmentStatus;
  confirmedAt?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  themeConfig?: Record<string, unknown>;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  remainingSpots?: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  typeId?: string;
  type?: ActivityType;
  requiresEnrollment: boolean;
  requiresConfirmation: boolean;
  confirmationDays?: number;
  speakers?: SpeakerAssociation[];
  enrollments?: ActivityEnrollment[];
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
  options?: string[];
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
  modalityId?: string;
  modality?: SubmissionModality;
  thematicAreaId?: string;
  thematicArea?: ThematicArea;
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

export interface SubmissionModality {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  templateUrl?: string;
  createdAt: string;
}

export interface ThematicArea {
  id: string;
  eventId: string;
  name: string;
  createdAt: string;
}

export interface SubmissionRule {
  id: string;
  eventId: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export interface SubmissionConfig {
  id: string;
  submissionsEnabled: boolean;
  submissionStartDate?: string;
  submissionEndDate?: string;
  reviewStartDate?: string;
  reviewEndDate?: string;
  scientificCommitteeHead?: string;
  scientificCommitteeEmail?: string;
  submissionModalities: SubmissionModality[];
  thematicAreas: ThematicArea[];
  submissionRules: SubmissionRule[];
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
  themeConfig?: Record<string, unknown>;
  seoTitle?: string;
  seoDescription?: string;

  // Submission module config
  submissionsEnabled?: boolean;
  submissionStartDate?: string;
  submissionEndDate?: string;
  reviewStartDate?: string;
  reviewEndDate?: string;
  scientificCommitteeHead?: string;
  scientificCommitteeEmail?: string;

  activities?: Activity[];
  tickets?: Ticket[];
  forms?: Form[];
  tenant?: Tenant;
  submissionModalities?: SubmissionModality[];
  thematicAreas?: ThematicArea[];
  submissionRules?: SubmissionRule[];
  _count?: {
    registrations: number;
  };
}

