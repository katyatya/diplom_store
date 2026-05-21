import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminService } from "./admin.service";

describe("AdminService", () => {
  it("creates product variants according to product category", async () => {
    let createdData: Record<string, unknown> | undefined;
    const prisma = {
      product: {
        create: async (args: { data: Record<string, unknown> }) => {
          createdData = args.data;
          return { id: "product-1", ...args.data };
        },
      },
    };
    const service = new AdminService(prisma as unknown as PrismaService);

    await service.createProduct({
      name: "Кеды",
      imageUrl: "/shoes.png",
      price: 4000,
      category: "Обувь",
    });

    assert.deepEqual(createdData?.variants, {
      create: [
        { sizeLabel: "35" },
        { sizeLabel: "36" },
        { sizeLabel: "37" },
        { sizeLabel: "38" },
        { sizeLabel: "39" },
        { sizeLabel: "40" },
        { sizeLabel: "41" },
      ],
    });
  });

  it("rejects an invalid order status transition", async () => {
    const prisma = {
      order: {
        findUnique: async () => ({ id: "order-1", status: "DELIVERED" }),
      },
    };
    const service = new AdminService(prisma as unknown as PrismaService);

    await assert.rejects(
      () => service.updateOrderStatus("order-1", { status: "NEW" }),
      BadRequestException,
    );
  });
});
