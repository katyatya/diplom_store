import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "../catalog/dto/create-product.dto";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { CreateStylistLookDto } from "./dto/create-stylist-look.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";
import { UpdateProductAdminDto } from "./dto/update-product-admin.dto";
import { UpdateStylistLookDto } from "./dto/update-stylist-look.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
    NEW: ["CONFIRMED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    CONFIRMED: ["ASSEMBLING", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    ASSEMBLING: [
      "READY_FOR_PICKUP",
      "SHIPPED",
      "CANCELLED_NO_STOCK",
      "CANCELLED_BY_CLIENT",
      "CANCELLED_OTHER",
    ],
    READY_FOR_PICKUP: ["DELIVERED", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
    SHIPPED: ["DELIVERED", "CANCELLED_OTHER"],
    DELIVERED: [],
    CANCELLED_NO_STOCK: [],
    CANCELLED_BY_CLIENT: [],
    CANCELLED_OTHER: [],
  };

  listProducts() {
    return this.prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  }

  createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        imageUrl: dto.imageUrl,
        price: new Prisma.Decimal(dto.price),
        category: dto.category ?? "Одежда",
        isNew: dto.isNew ?? false,
      },
    });
  }

  async updateProduct(productId: string, dto: UpdateProductAdminDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
      },
    });
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    return { success: true };
  }

  listBanners() {
    return this.prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        section: dto.section ?? "home",
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBanner(bannerId: string, dto: UpdateBannerDto) {
    const banner = await this.prisma.banner.findUnique({ where: { id: bannerId } });
    if (!banner) throw new NotFoundException("Banner not found");
    return this.prisma.banner.update({
      where: { id: bannerId },
      data: dto,
    });
  }

  async deleteBanner(bannerId: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id: bannerId } });
    if (!banner) throw new NotFoundException("Banner not found");
    await this.prisma.banner.delete({ where: { id: bannerId } });
    return { success: true };
  }

  listStylistLooks() {
    return this.prisma.outfit.findMany({
      where: { isStylist: true },
      orderBy: { createdAt: "desc" },
    });
  }

  createStylistLook(dto: CreateStylistLookDto) {
    return this.prisma.outfit.create({
      data: {
        userId: dto.stylistUserId,
        name: dto.name,
        description: dto.description,
        isStylist: true,
        items: dto.items as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateStylistLook(outfitId: string, dto: UpdateStylistLookDto) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit || !outfit.isStylist) {
      throw new NotFoundException("Stylist look not found");
    }
    return this.prisma.outfit.update({
      where: { id: outfitId },
      data: {
        name: dto.name,
        description: dto.description,
        userId: dto.stylistUserId,
        ...(dto.items ? { items: dto.items as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async deleteStylistLook(outfitId: string) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } });
    if (!outfit || !outfit.isStylist) {
      throw new NotFoundException("Stylist look not found");
    }
    await this.prisma.outfit.delete({ where: { id: outfitId } });
    return { success: true };
  }

  listOrders() {
    return this.prisma.order.findMany({
      include: { items: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const nextStatus = dto.status as OrderStatus;
    if (order.status !== nextStatus) {
      const allowedTransitions = this.orderStatusTransitions[order.status];
      if (!allowedTransitions.includes(nextStatus)) {
        throw new BadRequestException(
          `Invalid status transition: ${order.status} -> ${nextStatus}`,
        );
      }
    }

    const isCancelledStatus = String(nextStatus).startsWith("CANCELLED");
    if (isCancelledStatus && !dto.cancelReason?.trim()) {
      throw new BadRequestException("Cancel reason is required for cancelled orders");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        cancelReason: isCancelledStatus ? dto.cancelReason?.trim() : null,
      },
      include: { items: true, user: { select: { email: true } } },
    });
  }
}
