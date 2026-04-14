import { Module } from "@nestjs/common";
import { StylistLooksController } from "./stylist-looks.controller";
import { StylistLooksService } from "./stylist-looks.service";

@Module({
  providers: [StylistLooksService],
  controllers: [StylistLooksController],
})
export class StylistLooksModule {}
