import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug deve conter apenas letras minúsculas, números e hífens",
  })
  slug!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  location?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  seoTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  seoDescription?: string;

  @IsObject()
  @IsOptional()
  themeConfig?: Record<string, unknown>;

  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  @IsOptional()
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
