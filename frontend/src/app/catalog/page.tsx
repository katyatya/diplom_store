"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Product,
  addProductToCart,
  addToWishlist,
  fetchCategories,
  fetchProducts,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void fetchProducts({ category: activeCategory || undefined })
      .then(setProducts)
      .catch(() => {
        setProducts([]);
        setStatus("Не удалось загрузить каталог.");
      });
  }, [activeCategory]);

  async function onAddToCart(product: Product) {
    try {
      const mode = await addProductToCart(product, 1);
      setStatus(
        mode === "guest"
          ? "Товар добавлен в гостевую корзину."
          : "Товар добавлен в корзину.",
      );
    } catch {
      setStatus("Не удалось добавить товар в корзину.");
    }
  }

  async function onAddToWishlist(productId: string) {
    try {
      await addToWishlist(productId);
      setStatus("Товар добавлен в избранное.");
    } catch {
      setStatus("Для добавления в избранное требуется вход.");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Каталог</h1>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory ? "outline" : "secondary"}
          onClick={() => setActiveCategory("")}
          disabled={!activeCategory}
        >
          Все категории
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            variant={activeCategory === category ? "default" : "outline"}
          >
            {category}
          </Button>
        ))}
      </div>
      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="p-3 pb-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-44 w-full rounded-md object-cover"
              />
            </CardHeader>
            <CardContent className="grid gap-2 p-3">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <p className="text-sm">
                {Number(product.price).toLocaleString("ru-RU")} руб
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/catalog/${product.id}`}>Подробнее</Link>
                </Button>
                <Button size="sm" onClick={() => void onAddToCart(product)}>
                  В корзину
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void onAddToWishlist(product.id)}
                >
                  В избранное
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
