import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

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

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts(filters?: { category?: string; isNew?: string }) {
    const category = filters?.category?.trim();
    const isNew =
      filters?.isNew === "true"
        ? true
        : filters?.isNew === "false"
          ? false
          : undefined;

    return this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(isNew !== undefined ? { isNew } : {}),
      },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  createProduct(dto: CreateProductDto) {
    const category = dto.category ?? "Одежда";
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        price: new Prisma.Decimal(dto.price),
        imageUrl: dto.imageUrl,
        category,
        isNew: dto.isNew ?? false,
        variants: {
          create: getSizeLabelsByCategory(category).map((sizeLabel) => ({ sizeLabel })),
        },
      },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
    });
  }

  async listCategories() {
    const rows = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((row) => row.category);
  }

  listNewProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  listBanners(section?: string) {
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        ...(section ? { section } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
