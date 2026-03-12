export class CreateActivityDto {
  title!: string;
  description?: string;
  location?: string;
  startAt!: string;
  endAt!: string;
  capacity?: number;
  speakerIds?: string[];
}

