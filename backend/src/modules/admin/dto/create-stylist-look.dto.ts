import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class OutfitItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  zIndex!: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;
}

export class CreateStylistLookDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  stylistUserId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutfitItemDto)
  items!: OutfitItemDto[];
}
