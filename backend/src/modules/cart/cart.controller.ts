import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CartService } from "./cart.service";

@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@CurrentUser() user: JwtUser) {
    return this.cartService.getMyCart(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtUser, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }
}
