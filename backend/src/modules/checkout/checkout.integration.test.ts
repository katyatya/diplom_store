import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Test } from "@nestjs/testing";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

describe("Checkout module integration", () => {
  it("creates an order through controller and service", async () => {
    let clearedCartId: string | undefined;
    const prismaMock = {
      order: {
        findUnique: async () => null,
        create: async (args: { data: { id: string; totalAmount: unknown } }) => ({
          id: args.data.id,
          totalAmount: args.data.totalAmount,
          items: [{ id: "order-item-1" }],
        }),
      },
      cart: {
        findUnique: async () => ({
          id: "cart-1",
          items: [
            {
              variantId: "variant-1",
              quantity: 1,
              variant: {
                sizeLabel: "S",
                product: { name: "Юбка", price: "2500.00" },
              },
            },
          ],
        }),
      },
      cartItem: {
        deleteMany: async (args: { where: { cartId: string } }) => {
          clearedCartId = args.where.cartId;
        },
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: CheckoutService,
          useFactory: (prisma: PrismaService) => new CheckoutService(prisma),
          inject: [PrismaService],
        },
        {
          provide: CheckoutController,
          useFactory: (checkoutService: CheckoutService) =>
            new CheckoutController(checkoutService),
          inject: [CheckoutService],
        },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    const controller = moduleRef.get(CheckoutController);
    const user: JwtUser = {
      sub: "user-1",
      name: "Анна",
      email: "anna@example.com",
      role: "USER",
    };

    const result = await controller.createOrder(user, {
      customerName: "Анна",
      phone: "+7 (999) 999-99-99",
      email: "anna@example.com",
      deliveryType: "PICKUP",
      paymentMethod: "Онлайн",
    });

    assert.ok(result.id);
    assert.equal(String(result.totalAmount), "2500");
    assert.equal(clearedCartId, "cart-1");
  });
});
