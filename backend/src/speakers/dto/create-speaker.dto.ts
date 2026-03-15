import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSpeakerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
