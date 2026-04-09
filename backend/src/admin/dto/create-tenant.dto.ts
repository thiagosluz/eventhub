import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: "O nome do inquilino é obrigatório." })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "O slug é obrigatório." })
  slug!: string;

  @IsEmail({}, { message: "E-mail do administrador inválido." })
  @IsNotEmpty({ message: "O e-mail do administrador é obrigatório." })
  adminEmail!: string;

  @IsString()
  @IsNotEmpty({ message: "O nome do administrador é obrigatório." })
  adminName!: string;

  @IsString()
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  adminPassword!: string;
}
