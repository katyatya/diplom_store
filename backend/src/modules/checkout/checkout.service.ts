import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

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
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    const itemsTotal = cart.items.reduce((acc, item) => {
      return acc + Number(item.product.price) * item.quantity;
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
        totalAmount: new Prisma.Decimal(totalAmount),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Temporary "seller notification": order becomes visible in admin endpoint.
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
