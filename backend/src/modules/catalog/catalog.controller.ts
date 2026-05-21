import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { CreateProductDto } from "./dto/create-product.dto";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(
    @Query("category") category?: string,
    @Query("isNew") isNew?: string,
    @Query("collectionSlug") collectionSlug?: string,
  ) {
    return this.catalogService.listProducts({ category, isNew, collectionSlug });
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

  @Get("image-proxy")
  async imageProxy(@Query("url") url: string | undefined, @Res() res: Response) {
    if (!url) {
      res.status(400).send("Missing url query param");
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).send("Invalid image URL");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).send("Only http/https URLs are allowed");
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(parsedUrl.toString(), {
        signal: abortController.signal,
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
    } catch {
      res.status(504).send("Image fetch timeout");
      return;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!upstream.ok) {
      res.status(upstream.status).send("Failed to fetch image");
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const cacheControl = upstream.headers.get("cache-control") ?? "public, max-age=3600";
    const body = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    res.send(body);
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }
}
