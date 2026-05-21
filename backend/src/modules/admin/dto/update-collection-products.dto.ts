import { IsArray, IsString } from "class-validator";

export class UpdateCollectionProductsDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];
}
