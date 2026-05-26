import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { YooKassaService } from "./yookassa.service";
import { YooKassaWebhookNotification } from "./yookassa-webhook.types";

@Controller("checkout/yookassa")
export class YooKassaWebhookController {
  constructor(private readonly yookassaService: YooKassaService) {}

  @Post("webhook")
  async handleWebhook(
    @Req() req: Request,
    @Body() body: YooKassaWebhookNotification,
  ): Promise<{ ok: true }> {
    const devSecretHeader = req.header("x-yookassa-webhook-dev-secret") ?? undefined;
    await this.yookassaService.handleWebhook(
      body,
      this.resolveClientIp(req),
      devSecretHeader,
    );
    return { ok: true };
  }

  private resolveClientIp(req: Request): string | undefined {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0]?.trim();
    }
    return req.ip;
  }
}
