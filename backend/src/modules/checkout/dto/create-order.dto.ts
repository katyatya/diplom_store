import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class CreateOrderDto {
  @IsString()
  customerName!: string;

  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsIn(["PICKUP", "CDEK"])
  deliveryType!: "PICKUP" | "CDEK";

  @IsString()
  paymentMethod!: string;
}
