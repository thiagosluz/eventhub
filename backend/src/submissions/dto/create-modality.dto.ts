import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateModalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
