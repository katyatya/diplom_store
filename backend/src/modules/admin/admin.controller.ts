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
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateProductDto } from "../catalog/dto/create-product.dto";
import { AdminService } from "./admin.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { CreateStylistLookDto } from "./dto/create-stylist-look.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";
import { UpdateCollectionProductsDto } from "./dto/update-collection-products.dto";
import { UpdateProductAdminDto } from "./dto/update-product-admin.dto";
import { UpdateStylistLookDto } from "./dto/update-stylist-look.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("products")
  listProducts() {
    return this.adminService.listProducts();
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch("products/:id")
  updateProduct(@Param("id") id: string, @Body() dto: UpdateProductAdminDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get("banners")
  listBanners() {
    return this.adminService.listBanners();
  }

  @Get("collections")
  listCollections() {
    return this.adminService.listCollections();
  }

  @Post("collections")
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.adminService.createCollection(dto);
  }

  @Patch("collections/:id/products")
  updateCollectionProducts(
    @Param("id") id: string,
    @Body() dto: UpdateCollectionProductsDto,
  ) {
    return this.adminService.updateCollectionProducts(id, dto.productIds);
  }

  @Post("banners")
  createBanner(@Body() dto: CreateBannerDto) {
    return this.adminService.createBanner(dto);
  }

  @Patch("banners/:id")
  updateBanner(@Param("id") id: string, @Body() dto: UpdateBannerDto) {
    return this.adminService.updateBanner(id, dto);
  }

  @Delete("banners/:id")
  deleteBanner(@Param("id") id: string) {
    return this.adminService.deleteBanner(id);
  }

  @Get("stylist-looks")
  listStylistLooks() {
    return this.adminService.listStylistLooks();
  }

  @Post("stylist-looks")
  createStylistLook(@Body() dto: CreateStylistLookDto) {
    return this.adminService.createStylistLook(dto);
  }

  @Patch("stylist-looks/:id")
  updateStylistLook(@Param("id") id: string, @Body() dto: UpdateStylistLookDto) {
    return this.adminService.updateStylistLook(id, dto);
  }

  @Delete("stylist-looks/:id")
  deleteStylistLook(@Param("id") id: string) {
    return this.adminService.deleteStylistLook(id);
  }

  @Get("orders")
  listOrders() {
    return this.adminService.listOrders();
  }

  @Patch("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto);
  }
}
