import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts() {
    return this.catalogService.listProducts();
  }

  @Get("products/:id")
  getProduct(@Param("id") id: string) {
    return this.catalogService.getProduct(id);
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }
}
