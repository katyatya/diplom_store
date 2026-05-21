"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Banner,
  Product,
  addProductToCart,
  fetchBanners,
  fetchProducts,
} from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    void fetchBanners("home").then(setBanners).catch(() => setBanners([]));
    void fetchProducts({ isNew: true }).then(setNewProducts).catch(() => setNewProducts([]));
  }, []);

  async function handleAddToCart(product: Product) {
    const defaultVariant = product.variants[0];
    if (!defaultVariant) {
      showToast("Для товара не настроены размеры.", "error");
      return;
    }
    try {
      await addProductToCart(product, defaultVariant.id, defaultVariant.sizeLabel, 1);
      showToast("Товар добавлен в корзину");
    } catch {
      showToast("Не удалось добавить товар в корзину.", "error");
    }
  }

  return (
    <section className="grid gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Fashion Store</h1>
      <p className="-mt-2 text-muted-foreground">
        Магазин одежды с конструктором образов, сохранением в "Мои образы", корзиной и админкой.
      </p>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Баннеры главной</h2>
        <div className="grid gap-3">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={
                banner.collection?.slug
                  ? `/catalog/collection/${encodeURIComponent(banner.collection.slug)}`
                  : "/catalog"
              }
              className="group block"
            >
              <Card className="overflow-hidden">
                <div className="relative">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-[420px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <CardContent className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-3xl font-semibold sm:text-4xl">{banner.title}</p>
                    {banner.subtitle ? (
                      <p className="mt-2 text-base text-white/90 sm:text-lg">{banner.subtitle}</p>
                    ) : null}
                    {banner.collection?.title ? (
                      <p className="mt-3 text-sm uppercase tracking-[0.2em] text-white/80">
                        Коллекция: {banner.collection.title}
                      </p>
                    ) : null}
                  </CardContent>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Новинки</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {newProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader className="p-3 pb-0">
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className="h-40 w-full rounded-md object-cover"
                />
              </CardHeader>
              <CardContent className="grid gap-2 p-3">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {Number(product.price).toLocaleString("ru-RU")} руб
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/catalog/product/${product.slug || product.id}`}>Карточка</Link>
                  </Button>
                  <Button size="sm" onClick={() => void handleAddToCart(product)}>
                    В корзину
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
