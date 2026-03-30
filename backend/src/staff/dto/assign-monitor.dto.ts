import { IsNotEmpty, IsString } from "class-validator";

export class AssignMonitorDto {
  @IsString()
  @IsNotEmpty({ message: "ID do usuário é obrigatório" })
  userId!: string;
}
