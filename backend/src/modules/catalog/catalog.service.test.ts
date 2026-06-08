import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CatalogService } from "./catalog.service";
import { PRODUCT_CATEGORIES } from "./product-categories";

describe("CatalogService", () => {
  it("creates product with ONE_SIZE variants for accessories", async () => {
    let createdData: Record<string, unknown> | undefined;
    const prisma = {
      product: {
        create: async (args: { data: Record<string, unknown> }) => {
          createdData = args.data;
          return { id: "product-1", ...args.data, variants: [{ sizeLabel: "ONE_SIZE" }] };
        },
      },
    };
    const service = new CatalogService(prisma as unknown as DatabaseService);

    await service.createProduct({
      name: "Сумка",
      imageUrl: "/bag.jpg",
      price: 5000,
      category: "Сумки",
    });

    assert.deepEqual(createdData?.variants, {
      create: [{ sizeLabel: "ONE_SIZE" }],
    });
  });

  it("passes normalized filters to product list query", async () => {
    let whereClause: Record<string, unknown> | undefined;
    const prisma = {
      product: {
        findMany: async (args: { where: Record<string, unknown> }) => {
          whereClause = args.where;
          return [];
        },
      },
    };
    const service = new CatalogService(prisma as unknown as DatabaseService);

    await service.listProducts({
      category: "  Обувь  ",
      isNew: "true",
      collectionSlug: " summer-drop ",
    });

    assert.equal(whereClause?.isActive, true);
    assert.equal(whereClause?.category, "Обувь");
    assert.equal(whereClause?.isNew, true);
    assert.deepEqual(whereClause?.collections, {
      some: { collection: { slug: "summer-drop", isActive: true } },
    });
  });

  it("returns only allowed categories that have active products", async () => {
    const prisma = {
      product: {
        findMany: async () => [{ category: "Обувь" }, { category: "Брюки" }],
      },
    };
    const service = new CatalogService(prisma as unknown as DatabaseService);

    const categories = await service.listCategories();
    assert.deepEqual(categories, ["Брюки", "Обувь"]);
  });

  it("rejects product creation with unknown category", async () => {
    const prisma = {
      product: {
        create: async () => {
          throw new Error("Should not create product with invalid category");
        },
      },
    };
    const service = new CatalogService(prisma as unknown as DatabaseService);

    await assert.rejects(
      async () => {
        await service.createProduct({
          name: "Сумка",
          imageUrl: "/bag.jpg",
          price: 5000,
          category: "Несуществующая категория",
        });
      },
      (error: unknown) => error instanceof BadRequestException,
    );
  });

  it("throws not found for inactive product", async () => {
    const prisma = {
      product: {
        findUnique: async () => ({
          id: "product-1",
          isActive: false,
        }),
      },
    };
    const service = new CatalogService(prisma as unknown as DatabaseService);

    await assert.rejects(() => service.getProduct("product-1"), NotFoundException);
  });
});
