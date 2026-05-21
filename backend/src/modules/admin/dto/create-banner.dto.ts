import { IsBoolean, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @IsUrl()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
