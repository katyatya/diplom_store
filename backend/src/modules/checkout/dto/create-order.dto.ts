import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[A-Za-zА-Яа-яЁё\s'-]+$/u)
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/)
  phone!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ValidateIf((dto: CreateOrderDto) => dto.deliveryType === "CDEK")
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(200)
  address?: string;

  @IsIn(["PICKUP", "CDEK"])
  deliveryType!: "PICKUP" | "CDEK";

  @IsIn(["Онлайн", "При получении"])
  paymentMethod!: string;
}
