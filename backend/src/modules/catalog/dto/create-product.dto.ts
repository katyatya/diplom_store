import { IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @IsUrl()
  imageUrl!: string;
}
