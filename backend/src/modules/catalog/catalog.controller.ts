import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(
    @Query("category") category?: string,
    @Query("isNew") isNew?: string,
  ) {
    return this.catalogService.listProducts({ category, isNew });
  }

  @Get("products/:id")
  getProduct(@Param("id") id: string) {
    return this.catalogService.getProduct(id);
  }

  @Get("categories")
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get("sections/new")
  listNewProducts() {
    return this.catalogService.listNewProducts();
  }

  @Get("banners")
  listBanners(@Query("section") section?: string) {
    return this.catalogService.listBanners(section);
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }
}
