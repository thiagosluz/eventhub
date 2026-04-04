import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateOrganizerDto {
  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name!: string;

  @IsString()
  @MinLength(6, {
    message: "A senha temporária deve ter pelo menos 6 caracteres",
  })
  temporaryPassword!: string;
}
