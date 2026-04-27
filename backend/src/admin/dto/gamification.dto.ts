import {
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsString,
} from "class-validator";

export class UpdateGamificationConfigDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  dailyXpLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(2000)
  levelFormulaBase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(2.0)
  levelFormulaExponent?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(10000)
  spikeThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  spikeWindowMinutes?: number;
}

export class UpdateXpActionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  xpAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class SimulateLevelDto {
  @IsInt()
  @Min(100)
  @Max(2000)
  base!: number;

  @IsNumber()
  @Min(0.1)
  @Max(2.0)
  exponent!: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  maxLevel?: number;
}
