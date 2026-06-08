import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  composition?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  outfitImageUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;
}
