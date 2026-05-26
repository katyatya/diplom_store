import {
  Body,
  BadRequestException,
  Controller,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../../common/interfaces/jwt-user.interface";
import { DatabaseService } from "../../../database/database.service";
import { ConfirmMockPaymentDto } from "./dto/confirm-mock-payment.dto";
import { YooKassaService } from "./yookassa.service";

@UseGuards(JwtAuthGuard)
@Controller("checkout/yookassa")
export class YooKassaController {
  constructor(
    private readonly yookassaService: YooKassaService,
    private readonly prisma: DatabaseService,
  ) {}

  @Post("payment/:orderId")
  async createPayment(
    @CurrentUser() user: JwtUser,
    @Param("orderId") orderId: string,
  ): Promise<{ confirmationUrl: string; paymentId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        paymentMethod: true,
        totalAmount: true,
      },
    });

    if (!order || order.userId !== user.sub) {
      throw new BadRequestException("Order not found");
    }

    if (order.paymentMethod !== "Онлайн") {
      throw new BadRequestException("Payment method must be 'Онлайн'");
    }

    return this.yookassaService.createRedirectPayment({
      orderId: order.id,
      amountValue: order.totalAmount.toString(),
      description: `Заказ #${order.id}`,
    });
  }

  @Post("mock/confirm")
  async confirmMockPayment(
    @CurrentUser() user: JwtUser,
    @Body() dto: ConfirmMockPaymentDto,
  ): Promise<{ success: true }> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true, userId: true, status: true },
    });

    if (!order || order.userId !== user.sub) {
      throw new BadRequestException("Order not found");
    }

    await this.yookassaService.applyOrderPaymentResult(order.id, dto.result, {
      paymentId: `mock_${order.id}`,
      cancelReason: "Оплата не завершена (MVP mock YooKassa)",
    });

    return { success: true };
  }
}

