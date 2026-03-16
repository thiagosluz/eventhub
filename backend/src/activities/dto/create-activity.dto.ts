export class SpeakerAssociationDto {
  speakerId!: string;
  roleId?: string;
}

export class CreateActivityDto {
  title!: string;
  description?: string;
  location?: string;
  startAt!: string;
  endAt!: string;
  capacity?: number;
  typeId?: string;
  requiresEnrollment?: boolean;
  speakers?: SpeakerAssociationDto[];
}

