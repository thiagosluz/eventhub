import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  abstract?: string;

  @IsString()
  @IsOptional()
  modalityId?: string;

  @IsString()
  @IsOptional()
  thematicAreaId?: string;
}
