import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { SponsorSize } from "../../generated/prisma";

export class CreateSponsorCategoryDto {
  @IsString()
  name!: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(SponsorSize)
  @IsOptional()
  size?: SponsorSize;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateSponsorCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsEnum(SponsorSize)
  @IsOptional()
  size?: SponsorSize;

  @IsString()
  @IsOptional()
  color?: string;
}
