import { IsInt, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateSponsorDto {
  @IsString()
  categoryId!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string; // Will be set after upload

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateSponsorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
