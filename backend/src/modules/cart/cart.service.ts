import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found");
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: { increment: dto.quantity },
      },
    });

    return this.getMyCart(userId);
  }
}
