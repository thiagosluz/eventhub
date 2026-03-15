import { IsOptional, IsString, IsUrl, IsObject } from 'class-validator';

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
}
