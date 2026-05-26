import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "path";
import { HealthController } from "./health.controller";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CartModule } from "./modules/cart/cart.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { OutfitsModule } from "./modules/outfits/outfits.module";
import { StylistLooksModule } from "./modules/stylist-looks/stylist-looks.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { DatabaseModule } from "./database/database.module";
import { MailModule } from "./modules/mail/mail.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, "..", ".env"),
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    CatalogModule,
    CartModule,
    CheckoutModule,
    OutfitsModule,
    StylistLooksModule,
    WishlistModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
