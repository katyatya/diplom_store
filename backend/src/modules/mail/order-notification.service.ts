import { Injectable, Logger } from "@nestjs/common";
import { DeliveryType, Order, OrderItem, PaymentStatus } from "@prisma/client";
import { MailService } from "./mail.service";

type OrderWithItems = Order & { items: OrderItem[] };

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  PICKUP: "Самовывоз",
  CDEK: "Доставка СДЭК",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "оплата при получении",
  PENDING: "ожидает онлайн-оплаты",
  PAID: "оплачен онлайн",
  FAILED: "ошибка оплаты",
};

@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(private readonly mail: MailService) {}

  async notifyNewOrder(order: OrderWithItems): Promise<void> {
    const itemsLines = order.items.map(
      (item) =>
        `  • ${item.productName} (${item.sizeLabel}) × ${item.quantity} — ${formatMoney(item.productPrice)} ₽`,
    );
    const itemsTotal = order.items.reduce(
      (sum, item) => sum + Number(item.productPrice) * item.quantity,
      0,
    );
    const deliveryLabel = DELIVERY_LABELS[order.deliveryType];
    const paymentStatusLabel = PAYMENT_STATUS_LABELS[order.paymentStatus];

    const text = [
      `Поступил новый заказ #${order.id}`,
      "",
      `Клиент: ${order.customerName}`,
      `Телефон: ${order.phone}`,
      `Email: ${order.email}`,
      `Доставка: ${deliveryLabel}`,
      order.address ? `Адрес: ${order.address}` : null,
      `Способ оплаты: ${order.paymentMethod}`,
      `Статус оплаты: ${paymentStatusLabel}`,
      "",
      "Состав заказа:",
      ...itemsLines,
      "",
      `Товары: ${formatMoney(itemsTotal)} ₽`,
      `Доставка: ${formatMoney(order.deliveryPrice)} ₽`,
      `Итого: ${formatMoney(order.totalAmount)} ₽`,
      "",
      `Дата: ${order.createdAt.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const subject = `Новый заказ #${order.id} — ${order.customerName}`;
    const sent = await this.mail.sendMail({
      to: this.mail.adminOrderNotificationEmail,
      subject,
      text,
    });

    if (sent) {
      this.logger.log(`Order notification sent for #${order.id}`);
      return;
    }

    this.logger.warn(`Order notification was not sent for #${order.id}`);
    if (process.env.NODE_ENV !== "production") {
      this.logger.warn(`[DEV] Notification text:\n${text}`);
    }
  }
}

function formatMoney(value: { toString(): string } | number): string {
  const amount = Number(value);
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
