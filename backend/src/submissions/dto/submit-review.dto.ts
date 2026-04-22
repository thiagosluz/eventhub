import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SubmitReviewDto {
  @IsString()
  @IsNotEmpty()
  submissionId!: string;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  score?: number;

  @IsIn([
    "STRONG_ACCEPT",
    "ACCEPT",
    "WEAK_ACCEPT",
    "BORDERLINE",
    "WEAK_REJECT",
    "REJECT",
    "STRONG_REJECT",
  ])
  @IsOptional()
  recommendation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  comments?: string;
}
