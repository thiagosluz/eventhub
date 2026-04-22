import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class SpeakerAssociationDto {
  @IsString()
  @IsNotEmpty()
  speakerId!: string;

  @IsString()
  @IsOptional()
  roleId?: string;
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  typeId?: string;

  @IsBoolean()
  @IsOptional()
  requiresEnrollment?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresConfirmation?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  confirmationDays?: number;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SpeakerAssociationDto)
  @IsOptional()
  speakers?: SpeakerAssociationDto[];
}
