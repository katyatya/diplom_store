import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "../../database/database.service";
import { CreateProductDto } from "./dto/create-product.dto";
import {
  DEFAULT_PRODUCT_CATEGORY,
  PRODUCT_CATEGORIES,
  assertProductCategory,
  getSizeLabelsByCategory,
  resolveProductCategory,
} from "./product-categories";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: DatabaseService) {}

  listProducts(filters?: { category?: string; isNew?: string; collectionSlug?: string }) {
    const categoryInput = filters?.category?.trim();
    const category = categoryInput ? resolveProductCategory(categoryInput) ?? categoryInput : undefined;
    const collectionSlug = filters?.collectionSlug?.trim();
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
        ...(collectionSlug
          ? {
              collections: {
                some: {
                  collection: {
                    slug: collectionSlug,
                    isActive: true,
                  },
                },
              },
            }
          : {}),
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
    const category = dto.category
      ? assertProductCategory(dto.category)
      : DEFAULT_PRODUCT_CATEGORY;
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        price: new Prisma.Decimal(dto.price),
        imageUrl: dto.imageUrl,
        outfitImageUrl: dto.outfitImageUrl?.trim() || null,
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
    });

    const categoriesWithProducts = new Set(
      rows
        .map((row) => resolveProductCategory(row.category))
        .filter((category): category is (typeof PRODUCT_CATEGORIES)[number] => category !== null),
    );

    return PRODUCT_CATEGORIES.filter((category) => categoriesWithProducts.has(category));
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
      include: {
        collection: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
