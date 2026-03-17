import { IsString, IsNotEmpty } from "class-validator";

export class CreateActivityTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
