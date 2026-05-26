import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";

function extractProductId(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const productId = (value as { productId?: unknown }).productId;
  return typeof productId === "string" ? productId : null;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: DatabaseService) {}

  async getMyCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    });

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });
    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw new NotFoundException("Product variant not found");
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: dto.variantId,
        },
      },
      create: {
        cartId: cart.id,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
      update: {
        quantity: { increment: dto.quantity },
      },
    });

    return this.getMyCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException("Cart not found");

    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.getMyCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException("Cart not found");

    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getMyCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getMyCart(userId);
  }

  async addOutfit(userId: string, outfitId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit) {
      throw new NotFoundException("Outfit not found");
    }

    const items = Array.isArray(outfit.items) ? outfit.items : [];
    const productIds = Array.from(new Set(items.map(extractProductId).filter(Boolean))) as string[];

    for (const productId of productIds) {
      const defaultVariant = await this.prisma.productVariant.findFirst({
        where: { productId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (!defaultVariant) {
        continue;
      }
      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: defaultVariant.id,
          },
        },
        create: {
          cartId: cart.id,
          variantId: defaultVariant.id,
          quantity: 1,
        },
        update: {
          quantity: { increment: 1 },
        },
      });
    }

    return this.getMyCart(userId);
  }
}
