import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CartService } from "./cart.service";

describe("CartService", () => {
  it("adds an active product variant to the user's cart", async () => {
    const cart = { id: "cart-1", userId: "user-1" };
    const prisma = {
      productVariant: {
        findUnique: async () => ({
          id: "variant-1",
          isActive: true,
          product: { id: "product-1", isActive: true },
        }),
      },
      cart: {
        upsert: async (args: unknown) => {
          const include = (args as { include?: unknown }).include;
          return include ? { ...cart, items: [] } : cart;
        },
      },
      cartItem: {
        upsert: async (args: unknown) => args,
      },
    };
    const service = new CartService(prisma as unknown as DatabaseService);

    const result = await service.addItem("user-1", {
      variantId: "variant-1",
      quantity: 2,
    });

    assert.deepEqual(result, { ...cart, items: [] });
  });

  it("rejects an inactive product variant", async () => {
    const prisma = {
      productVariant: {
        findUnique: async () => ({
          id: "variant-1",
          isActive: false,
          product: { id: "product-1", isActive: true },
        }),
      },
    };
    const service = new CartService(prisma as unknown as DatabaseService);

    await assert.rejects(
      () =>
        service.addItem("user-1", {
          variantId: "variant-1",
          quantity: 1,
        }),
      NotFoundException,
    );
  });
});
