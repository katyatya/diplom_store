import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CheckoutService } from "./checkout.service";

@UseGuards(JwtAuthGuard)
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("order")
  createOrder(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.checkoutService.createOrder(user.sub, dto);
  }

  @Get("orders")
  listMyOrders(@CurrentUser() user: JwtUser) {
    return this.checkoutService.listMyOrders(user.sub);
  }
}
