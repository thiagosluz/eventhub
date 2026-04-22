import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateSubmissionRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;
}
