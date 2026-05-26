import { IsIn, IsString } from "class-validator";

export class ConfirmMockPaymentDto {
  @IsString()
  orderId!: string;

  @IsIn(["success", "fail"])
  result!: "success" | "fail";
}

