import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProfileDto {
  @ApiProperty({ example: "Thiago Luz", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "thiago@example.com", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "Software Engineer", required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: "thiago", required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: ["javascript", "react"], required: false })
  @IsOptional()
  interests?: string[];

  @ApiProperty({ example: "zinc", required: false })
  @IsString()
  @IsOptional()
  profileTheme?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  publicProfile?: boolean;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: "oldpassword123" })
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({ example: "newpassword123" })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
