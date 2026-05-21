import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateCollectionDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
