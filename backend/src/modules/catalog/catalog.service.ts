import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

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
      orderBy: { createdAt: "desc" },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        price: new Prisma.Decimal(dto.price),
        imageUrl: dto.imageUrl,
        category: dto.category ?? "Одежда",
        isNew: dto.isNew ?? false,
      },
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
