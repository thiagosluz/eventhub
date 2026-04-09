import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export class AdminUpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: "E-mail inválido." })
  @IsOptional()
  email?: string;

  @IsEnum(["USER", "ORGANIZER", "MONITOR", "SPEAKER", "SUPER_ADMIN"])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}
