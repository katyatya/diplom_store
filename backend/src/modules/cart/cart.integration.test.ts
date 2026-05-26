import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Test } from "@nestjs/testing";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { DatabaseService } from "../../database/database.service";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

describe("Cart module integration", () => {
  it("handles adding a cart item through controller and service", async () => {
    const cart = { id: "cart-1", userId: "user-1" };
    const prismaMock = {
      productVariant: {
        findUnique: async () => ({
          id: "variant-1",
          isActive: true,
          product: { id: "product-1", isActive: true },
        }),
      },
      cart: {
        upsert: async (args: { include?: unknown }) =>
          args.include ? { ...cart, items: [] } : cart,
      },
      cartItem: {
        upsert: async () => ({ id: "cart-item-1" }),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CartService,
          useFactory: (prisma: DatabaseService) => new CartService(prisma),
          inject: [DatabaseService],
        },
        {
          provide: CartController,
          useFactory: (cartService: CartService) => new CartController(cartService),
          inject: [CartService],
        },
        { provide: DatabaseService, useValue: prismaMock },
      ],
    }).compile();

    const controller = moduleRef.get(CartController);
    const user: JwtUser = {
      sub: "user-1",
      name: "Анна",
      email: "anna@example.com",
      role: "USER",
    };

    const result = await controller.addItem(user, {
      variantId: "variant-1",
      quantity: 2,
    });

    assert.deepEqual(result, { ...cart, items: [] });
  });
});
