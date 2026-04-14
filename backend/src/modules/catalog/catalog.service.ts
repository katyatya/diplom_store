import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true },
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
        price: new Prisma.Decimal(dto.price),
        imageUrl: dto.imageUrl,
      },
    });
  }
}
