import { IsString, IsNotEmpty } from "class-validator";

export class CreateSpeakerRoleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
