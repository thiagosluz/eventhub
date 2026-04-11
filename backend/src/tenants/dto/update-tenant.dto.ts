import { IsOptional, IsString, IsUrl, IsObject } from "class-validator";

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsObject()
  @IsOptional()
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    [key: string]: any;
  };

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  instagramUrl?: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @IsUrl()
  @IsOptional()
  twitterUrl?: string;

  @IsUrl()
  @IsOptional()
  coverUrl?: string;
}
