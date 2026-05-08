import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { AddOutfitToCartDto } from "./dto/add-outfit-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
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

  @Patch("items/:itemId")
  updateItem(
    @CurrentUser() user: JwtUser,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, itemId, dto.quantity);
  }

  @Delete("items/:itemId")
  removeItem(@CurrentUser() user: JwtUser, @Param("itemId") itemId: string) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete()
  clear(@CurrentUser() user: JwtUser) {
    return this.cartService.clear(user.sub);
  }

  @Post("outfits")
  addOutfit(@CurrentUser() user: JwtUser, @Body() dto: AddOutfitToCartDto) {
    return this.cartService.addOutfit(user.sub, dto.outfitId);
  }
}
