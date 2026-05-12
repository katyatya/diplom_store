import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "ASSEMBLING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED_NO_STOCK",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_OTHER",
] as const;

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancelReason?: string;
}
