import { IsString } from "class-validator";

export class AddOutfitToCartDto {
  @IsString()
  outfitId!: string;
}
