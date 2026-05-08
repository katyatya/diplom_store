import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JwtUser } from "../../common/interfaces/jwt-user.interface";
import { AddWishlistItemDto } from "./dto/add-wishlist-item.dto";
import { WishlistService } from "./wishlist.service";

@UseGuards(JwtAuthGuard)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.wishlistService.list(user.sub);
  }

  @Post("items")
  add(@CurrentUser() user: JwtUser, @Body() dto: AddWishlistItemDto) {
    return this.wishlistService.add(user.sub, dto.productId);
  }

  @Delete("items/:productId")
  remove(@CurrentUser() user: JwtUser, @Param("productId") productId: string) {
    return this.wishlistService.remove(user.sub, productId);
  }
}
