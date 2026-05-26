import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentStatus, Prisma } from "@prisma/client";
import { DatabaseService } from "../../database/database.service";
import { OrderNotificationService } from "../mail/order-notification.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly orderNotifications: OrderNotificationService,
  ) {}

  private async generateNumericOrderId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${Date.now()}${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      const existing = await this.prisma.order.findUnique({
        where: { id: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    return `${Date.now()}${Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")}`;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (dto.deliveryType === "PICKUP") {
      dto.address = undefined;
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    const itemsTotal = cart.items.reduce((acc, item) => {
      return acc + Number(item.variant.product.price) * item.quantity;
    }, 0);
    const deliveryPrice = dto.deliveryType === "CDEK" ? 370 : 0;
    const totalAmount = itemsTotal + deliveryPrice;

    const numericOrderId = await this.generateNumericOrderId();

    const order = await this.prisma.order.create({
      data: {
        id: numericOrderId,
        userId,
        customerName: dto.customerName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        deliveryType: dto.deliveryType,
        deliveryPrice: new Prisma.Decimal(deliveryPrice),
        paymentMethod: dto.paymentMethod,
        paymentStatus:
          dto.paymentMethod === "Онлайн" ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
        totalAmount: new Prisma.Decimal(totalAmount),
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            sizeLabel: item.variant.sizeLabel,
            productName: item.variant.product.name,
            productPrice: item.variant.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    void this.orderNotifications.notifyNewOrder(order).catch(() => {
      // Errors are logged in MailService / OrderNotificationService.
    });

    return order;
  }

  listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
