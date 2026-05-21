import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "../catalog/dto/create-product.dto";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { CreateStylistLookDto } from "./dto/create-stylist-look.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";
import { UpdateProductAdminDto } from "./dto/update-product-admin.dto";
import { UpdateStylistLookDto } from "./dto/update-stylist-look.dto";

function getSizeLabelsByCategory(category: string): string[] {
  const normalized = category.trim().toLowerCase();
  const shoeCategories = ["обувь"];
  const oneSizeCategories = ["сумки", "аксессуары", "аксессуар"];

  if (shoeCategories.some((entry) => normalized.includes(entry))) {
    return ["35", "36", "37", "38", "39", "40", "41"];
  }
  if (oneSizeCategories.some((entry) => normalized.includes(entry))) {
    return ["ONE_SIZE"];
  }
  return ["XS", "S", "M", "L", "XL"];
}

function slugifyCollectionTitle(input: string): string {
  const translitMap: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  const transliterated = input
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("");
  const slug = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "collection";
}

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
    return this.prisma.product.findMany({
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createProduct(dto: CreateProductDto) {
    const category = dto.category ?? "Одежда";
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        imageUrl: dto.imageUrl,
        price: new Prisma.Decimal(dto.price),
        category,
        isNew: dto.isNew ?? false,
        variants: {
          create: getSizeLabelsByCategory(category).map((sizeLabel) => ({ sizeLabel })),
        },
      },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
    });
  }

  async updateProduct(productId: string, dto: UpdateProductAdminDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    if (dto.category && dto.category !== product.category) {
      await this.prisma.productVariant.updateMany({
        where: { productId },
        data: { isActive: false },
      });
      const nextSizes = getSizeLabelsByCategory(dto.category);
      for (const sizeLabel of nextSizes) {
        await this.prisma.productVariant.upsert({
          where: { productId_sizeLabel: { productId, sizeLabel } },
          create: { productId, sizeLabel, isActive: true },
          update: { isActive: true },
        });
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
      },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
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
    return this.prisma.banner.findMany({
      include: {
        collection: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  listCollections() {
    return this.prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        products: {
          select: {
            productId: true,
          },
        },
      },
    });
  }

  async createCollection(dto: CreateCollectionDto) {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException("Collection title is required");
    }

    const baseSlug = (dto.slug?.trim() || slugifyCollectionTitle(title)).toLowerCase();
    const normalizedBaseSlug = baseSlug
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
    if (!normalizedBaseSlug) {
      throw new BadRequestException("Collection slug is invalid");
    }

    let slug = normalizedBaseSlug;
    let suffix = 1;
    while (await this.prisma.collection.findUnique({ where: { slug } })) {
      slug = `${normalizedBaseSlug}-${suffix}`;
      suffix += 1;
    }

    return this.prisma.collection.create({
      data: {
        title,
        slug,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        products: {
          select: {
            productId: true,
          },
        },
      },
    });
  }

  async updateCollectionProducts(collectionId: string, productIds: string[]) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });
    if (!collection) {
      throw new NotFoundException("Collection not found");
    }

    const normalizedProductIds = Array.from(
      new Set(productIds.map((id) => id.trim()).filter(Boolean)),
    );

    if (normalizedProductIds.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: normalizedProductIds } },
        select: { id: true },
      });
      if (existingProducts.length !== normalizedProductIds.length) {
        throw new BadRequestException("Some products were not found");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productCollection.deleteMany({ where: { collectionId } });
      if (normalizedProductIds.length > 0) {
        await tx.productCollection.createMany({
          data: normalizedProductIds.map((productId) => ({
            collectionId,
            productId,
          })),
        });
      }
    });

    return this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        products: {
          select: {
            productId: true,
          },
        },
      },
    });
  }

  createBanner(dto: CreateBannerDto) {
    return this.prisma.$transaction(async (tx) => {
      const collectionId = dto.collectionId?.trim() || undefined;
      if (collectionId) {
        const collection = await tx.collection.findUnique({
          where: { id: collectionId },
          select: { id: true },
        });
        if (!collection) {
          throw new BadRequestException("Collection not found");
        }
      }

      return tx.banner.create({
        data: {
          title: dto.title,
          subtitle: dto.subtitle,
          imageUrl: dto.imageUrl,
          section: "home",
          collectionId,
          isActive: dto.isActive ?? true,
        },
        include: {
          collection: { select: { id: true, slug: true, title: true } },
        },
      });
    });
  }

  async updateBanner(bannerId: string, dto: UpdateBannerDto) {
    const banner = await this.prisma.banner.findUnique({ where: { id: bannerId } });
    if (!banner) throw new NotFoundException("Banner not found");
    const nextCollectionId =
      dto.collectionId !== undefined ? (dto.collectionId?.trim() || null) : undefined;
    if (nextCollectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: nextCollectionId },
        select: { id: true },
      });
      if (!collection) {
        throw new BadRequestException("Collection not found");
      }
    }
    return this.prisma.banner.update({
      where: { id: bannerId },
      data: {
        ...dto,
        ...(nextCollectionId !== undefined ? { collectionId: nextCollectionId } : {}),
        section: "home",
      },
      include: {
        collection: { select: { id: true, slug: true, title: true } },
      },
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
