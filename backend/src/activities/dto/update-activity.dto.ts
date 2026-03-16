export class UpdateActivityDto {
  title?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  capacity?: number;
  typeId?: string;
  requiresEnrollment?: boolean;
  speakers?: { speakerId: string; roleId?: string }[];
}

