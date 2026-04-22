import { Transform } from "class-transformer";
import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";
import { emptyStringToUndefined } from "../../common/transformers/empty-to-undefined";

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Transform(emptyStringToUndefined)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(emptyStringToUndefined)
  logoUrl?: string;

  @IsObject()
  @IsOptional()
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    [key: string]: unknown;
  };

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(emptyStringToUndefined)
  bio?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(300)
  @Transform(emptyStringToUndefined)
  websiteUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(300)
  @Transform(emptyStringToUndefined)
  instagramUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(300)
  @Transform(emptyStringToUndefined)
  linkedinUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(300)
  @Transform(emptyStringToUndefined)
  twitterUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(emptyStringToUndefined)
  coverUrl?: string;
}
