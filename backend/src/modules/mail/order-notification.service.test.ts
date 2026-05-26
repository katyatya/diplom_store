import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeliveryType, OrderStatus, PaymentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { MailService } from "./mail.service";
import { OrderNotificationService } from "./order-notification.service";

describe("OrderNotificationService", () => {
  it("sends a new order notification to the admin email", async () => {
    let sentTo: string | undefined;
    let sentSubject: string | undefined;
    let sentText: string | undefined;

    const mail = {
      adminOrderNotificationEmail: "katet.tetet@mail.ru",
      sendMail: async (payload: { to: string; subject: string; text: string }) => {
        sentTo = payload.to;
        sentSubject = payload.subject;
        sentText = payload.text;
        return true;
      },
    };

    const service = new OrderNotificationService(mail as unknown as MailService);
    const createdAt = new Date("2026-05-26T12:00:00.000Z");

    await service.notifyNewOrder({
      id: "17482656001234",
      userId: "user-1",
      customerName: "Анна",
      phone: "+79999999999",
      email: "anna@example.com",
      address: "Москва, ул. Примерная, 1",
      deliveryType: DeliveryType.CDEK,
      deliveryPrice: new Decimal(370),
      paymentMethod: "Онлайн",
      paymentStatus: PaymentStatus.PENDING,
      yookassaPaymentId: null,
      paidAt: null,
      status: OrderStatus.NEW,
      cancelReason: null,
      totalAmount: new Decimal(3370),
      createdAt,
      updatedAt: createdAt,
      items: [
        {
          id: "item-1",
          orderId: "17482656001234",
          variantId: "variant-1",
          sizeLabel: "M",
          productName: "Платье",
          productPrice: new Decimal(1500),
          quantity: 2,
        },
      ],
    });

    assert.equal(sentTo, "katet.tetet@mail.ru");
    assert.match(sentSubject ?? "", /Новый заказ #17482656001234/);
    assert.match(sentText ?? "", /Анна/);
    assert.match(sentText ?? "", /Платье/);
    assert.match(sentText ?? "", /3[\s\u00a0]?370/);
  });
});
