import { Module } from "@nestjs/common";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";
import { YooKassaController } from "./yookassa/yookassa.controller";
import { YooKassaWebhookController } from "./yookassa/yookassa-webhook.controller";
import { YooKassaService } from "./yookassa/yookassa.service";

@Module({
  controllers: [CheckoutController, YooKassaController, YooKassaWebhookController],
  providers: [CheckoutService, YooKassaService],
})
export class CheckoutModule {}
