import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ManualRegisterReviewerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  temporaryPassword!: string;
}
