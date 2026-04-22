import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";
import { emptyStringToUndefined } from "../../common/transformers/empty-to-undefined";

export class CreateSpeakerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(180)
  @Transform(emptyStringToUndefined)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(emptyStringToUndefined)
  bio?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  @Transform(emptyStringToUndefined)
  avatarUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  @Transform(emptyStringToUndefined)
  linkedinUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  @Transform(emptyStringToUndefined)
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  @Transform(emptyStringToUndefined)
  userId?: string | null;
}
