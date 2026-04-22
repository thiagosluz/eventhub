import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateSubmissionConfigDto {
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
