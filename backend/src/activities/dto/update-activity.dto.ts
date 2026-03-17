export class UpdateActivityDto {
  title?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  typeId?: string;
  requiresEnrollment?: boolean;
  requiresConfirmation?: boolean;
  confirmationDays?: number;
  speakers?: { speakerId: string; roleId?: string }[];
}
