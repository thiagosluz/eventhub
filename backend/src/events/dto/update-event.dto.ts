import { PartialType } from "@nestjs/mapped-types";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { CreateEventDto } from "./create-event.dto";

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @IsBoolean()
  @IsOptional()
  submissionsEnabled?: boolean;

  @IsDateString()
  @IsOptional()
  submissionStartDate?: string;

  @IsDateString()
  @IsOptional()
  submissionEndDate?: string;

  @IsDateString()
  @IsOptional()
  reviewStartDate?: string;

  @IsDateString()
  @IsOptional()
  reviewEndDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  scientificCommitteeHead?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  scientificCommitteeEmail?: string;
}
