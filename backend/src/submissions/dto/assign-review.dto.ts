import { IsNotEmpty, IsString } from "class-validator";

export class AssignReviewDto {
  @IsString()
  @IsNotEmpty()
  submissionId!: string;

  @IsString()
  @IsNotEmpty()
  reviewerId!: string;
}
