import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateThematicAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
