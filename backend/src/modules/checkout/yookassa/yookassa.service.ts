import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CurrencyEnum, YooKassa } from "@webzaytsev/yookassa-ts-sdk";
import { DatabaseService } from "../../../database/database.service";
import { YooKassaWebhookNotification } from "./yookassa-webhook.types";

const YOOKASSA_IPV4_CIDRS = ["185.71.76.0/27", "185.71.77.0/27", "77.75.153.0/25"] as const;
const YOOKASSA_IPV4_HOSTS = ["77.75.156.11", "77.75.156.35"] as const;

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  if (!network || Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

function isYooKassaIpv4(ip: string): boolean {
  if ((YOOKASSA_IPV4_HOSTS as readonly string[]).includes(ip)) return true;
  return YOOKASSA_IPV4_CIDRS.some((cidr) => isIpv4InCidr(ip, cidr));
}

function parseEnvFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function isLocalhostIp(ip: string | undefined): boolean {
  if (!ip) return false;
  const normalized = ip.trim().toLowerCase();
  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost" ||
    normalized.startsWith("::ffff:127.0.0.1")
  );
}

export type CreateRedirectPaymentResult = {
  confirmationUrl: string;
  paymentId: string;
};

@Injectable()
export class YooKassaService {
  private readonly logger = new Logger(YooKassaService.name);
  private readonly mode: "mock" | "real";
  private readonly sdk?: ReturnType<typeof YooKassa>;
  private readonly returnUrlBase: string;
  private readonly skipWebhookIpCheck: boolean;
  private readonly webhookDevSecret?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: DatabaseService,
  ) {
    const envMode = this.config.get<string>("YOOKASSA_MODE");
    const shopId = this.config.get<string>("YOOKASSA_SHOP_ID");
    const secretKey = this.config.get<string>("YOOKASSA_SECRET_KEY");

    this.returnUrlBase =
      this.config.get<string>("YOOKASSA_RETURN_URL") ?? "http://localhost:3001/checkout/return";
    this.skipWebhookIpCheck = parseEnvFlag(
      this.config.get<string>("YOOKASSA_WEBHOOK_SKIP_IP_CHECK"),
    );
    const rawDevSecret = this.config.get<string>("YOOKASSA_WEBHOOK_DEV_SECRET");
    this.webhookDevSecret = rawDevSecret?.trim().replace(/^["']|["']$/g, "");

    const useMock = envMode === "mock" || !shopId || !secretKey;
    this.mode = useMock ? "mock" : "real";

    if (this.mode === "real") {
      this.sdk = YooKassa({
        shop_id: shopId!,
        secret_key: secretKey!,
      });
    }
  }

  private buildReturnUrl(orderId: string): string {
    const url = new URL(this.returnUrlBase);
    url.searchParams.set("orderId", orderId);
    return url.toString();
  }

  async createRedirectPayment(params: {
    orderId: string;
    amountValue: string;
    description: string;
  }): Promise<CreateRedirectPaymentResult> {
    if (!params.orderId) throw new BadRequestException("orderId is required");

    const returnUrl = this.buildReturnUrl(params.orderId);

    if (this.mode === "mock") {
      const confirmationUrl = new URL(returnUrl);
      confirmationUrl.searchParams.set("mock", "1");
      confirmationUrl.searchParams.set("result", "success");
      const paymentId = `mock_${params.orderId}`;

      await this.attachPaymentToOrder(params.orderId, paymentId);

      return {
        confirmationUrl: confirmationUrl.toString(),
        paymentId,
      };
    }

    // Real redirect flow: create payment and redirect to `payment.confirmation.confirmation_url`.
    const payment = await this.sdk!.payments.create(
      {
        amount: { value: params.amountValue, currency: CurrencyEnum.RUB },
        confirmation: { type: "redirect", return_url: returnUrl },
        capture: true,
        description: params.description,
        metadata: { order_id: params.orderId },
      },
      `checkout_${params.orderId}_${Date.now()}`,
    );

    // SDK типизирует confirmation как union (redirect/embed). Нам нужен redirect-сценарий.
    const confirmationUrl = (payment.confirmation as { confirmation_url?: string } | undefined)
      ?.confirmation_url;
    if (!confirmationUrl) {
      throw new BadRequestException("YooKassa didn't return confirmation_url");
    }

    await this.attachPaymentToOrder(params.orderId, payment.id);

    return { confirmationUrl, paymentId: payment.id };
  }

  private async attachPaymentToOrder(orderId: string, paymentId: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        yookassaPaymentId: paymentId,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
  }

  async applyOrderPaymentResult(
    orderId: string,
    result: "success" | "fail",
    options?: { cancelReason?: string; paymentId?: string },
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true },
    });

    if (!order) {
      this.logger.warn(`Order not found for payment update: ${orderId}`);
      return;
    }

    if (order.status === OrderStatus.DELIVERED) {
      return;
    }

    const terminalStatuses: OrderStatus[] = [
      OrderStatus.CANCELLED_NO_STOCK,
      OrderStatus.CANCELLED_BY_CLIENT,
      OrderStatus.CANCELLED_OTHER,
    ];
    if (result === "fail" && terminalStatuses.includes(order.status)) {
      return;
    }
    if (result === "success" && order.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    const nextStatus =
      result === "success" ? OrderStatus.CONFIRMED : OrderStatus.CANCELLED_OTHER;
    const paymentId = options?.paymentId?.trim();

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        paymentStatus: result === "success" ? PaymentStatus.PAID : PaymentStatus.FAILED,
        paidAt: result === "success" ? new Date() : null,
        ...(paymentId ? { yookassaPaymentId: paymentId } : {}),
        cancelReason:
          result === "success"
            ? null
            : (options?.cancelReason ?? "Оплата не завершена (YooKassa)"),
      },
    });
  }

  assertWebhookRequestAllowed(clientIp: string | undefined, devSecretHeader?: string): void {
    // MVP mock: webhook можно тестировать локально без IP YooKassa.
    if (this.mode === "mock") {
      return;
    }

    const devSecret = devSecretHeader?.trim();
    if (this.webhookDevSecret && devSecret === this.webhookDevSecret) {
      return;
    }

    if (this.skipWebhookIpCheck || isLocalhostIp(clientIp)) {
      return;
    }

    const ip = clientIp?.trim();
    if (!ip || !isYooKassaIpv4(ip)) {
      throw new ForbiddenException("Webhook request is not allowed");
    }
  }

  async handleWebhook(
    payload: YooKassaWebhookNotification,
    clientIp?: string,
    devSecretHeader?: string,
  ): Promise<void> {
    this.assertWebhookRequestAllowed(clientIp, devSecretHeader);

    const event = payload.event;
    const payment = payload.object;
    const orderId = payment?.metadata?.order_id;

    if (!event || !payment?.id) {
      this.logger.warn("YooKassa webhook: missing event or payment id");
      return;
    }

    if (!orderId) {
      this.logger.warn(`YooKassa webhook ${event}: metadata.order_id is missing`);
      return;
    }

    if (this.mode === "real" && this.sdk) {
      const verified = await this.sdk.payments.load(payment.id);
      if (verified.metadata?.order_id && verified.metadata.order_id !== orderId) {
        this.logger.warn(`YooKassa webhook: order_id mismatch for payment ${payment.id}`);
        return;
      }
    }

    switch (event) {
      case "payment.succeeded":
        if (payment.status && payment.status !== "succeeded") {
          return;
        }
        await this.applyOrderPaymentResult(orderId, "success", {
          paymentId: payment.id,
        });
        break;
      case "payment.canceled":
        await this.applyOrderPaymentResult(orderId, "fail", {
          paymentId: payment.id,
          cancelReason: "Оплата отменена (YooKassa)",
        });
        break;
      default:
        this.logger.debug(`YooKassa webhook ignored: ${event}`);
    }
  }
}

