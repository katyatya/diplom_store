import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CheckoutService } from "./checkout.service";

describe("CheckoutService", () => {
  it("creates an order from cart items and clears the cart", async () => {
    let createdOrderData: Record<string, unknown> | undefined;
    let clearedCartId: string | undefined;

    const prisma = {
      order: {
        findUnique: async () => null,
        create: async (args: { data: Record<string, unknown> }) => {
          createdOrderData = args.data;
          return { id: args.data.id, items: [{ id: "order-item-1" }] };
        },
      },
      cart: {
        findUnique: async () => ({
          id: "cart-1",
          items: [
            {
              variantId: "variant-1",
              quantity: 2,
              variant: {
                sizeLabel: "M",
                product: { name: "Платье", price: "1500.00" },
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
    const service = new CheckoutService(prisma as unknown as DatabaseService);

    const result = await service.createOrder("user-1", {
      customerName: "Анна",
      phone: "+79999999999",
      email: "anna@example.com",
      address: "Москва",
      deliveryType: "CDEK",
      paymentMethod: "Онлайн",
    });

    assert.ok(result.id);
    assert.equal(createdOrderData?.userId, "user-1");
    assert.equal(String(createdOrderData?.deliveryPrice), "370");
    assert.equal(String(createdOrderData?.totalAmount), "3370");
    assert.equal(clearedCartId, "cart-1");
  });

  it("does not create an order when the cart is empty", async () => {
    const prisma = {
      cart: {
        findUnique: async () => ({ id: "cart-1", items: [] }),
      },
    };
    const service = new CheckoutService(prisma as unknown as DatabaseService);

    await assert.rejects(
      () =>
        service.createOrder("user-1", {
          customerName: "Анна",
          phone: "+79999999999",
          email: "anna@example.com",
          deliveryType: "PICKUP",
          paymentMethod: "Онлайн",
        }),
      BadRequestException,
    );
  });
});
