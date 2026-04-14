import { Controller, Get } from "@nestjs/common";
import { StylistLooksService } from "./stylist-looks.service";

@Controller("stylist-looks")
export class StylistLooksController {
  constructor(private readonly stylistLooksService: StylistLooksService) {}

  @Get()
  list() {
    return this.stylistLooksService.list();
  }
}
