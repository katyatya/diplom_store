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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    void fetchBanners("home").then(setBanners).catch(() => setBanners([]));
    void fetchProducts({ isNew: true }).then(setNewProducts).catch(() => setNewProducts([]));
  }, []);

  async function handleAddToCart(product: Product) {
    try {
      const mode = await addProductToCart(product, 1);
      setMessage(
        mode === "guest"
          ? "Товар добавлен в гостевую корзину."
          : "Товар добавлен в корзину аккаунта.",
      );
    } catch {
      setMessage("Не удалось добавить товар в корзину.");
    }
  }

  return (
    <section className="grid gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Fashion Store</h1>
      <p className="-mt-2 text-muted-foreground">
        Магазин одежды с конструктором образов, сохранением в "Мои образы", корзиной и админкой.
      </p>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Баннеры главной</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="h-44 w-full object-cover"
              />
              <CardContent className="p-4">
                <p className="font-medium">{banner.title}</p>
                <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
              </CardContent>
            </Card>
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
                  src={product.imageUrl}
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
                    <Link href={`/catalog/${product.id}`}>Карточка</Link>
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
