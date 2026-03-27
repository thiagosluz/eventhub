import { IsEmail, IsNotEmpty } from "class-validator";

export class InviteReviewerDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
