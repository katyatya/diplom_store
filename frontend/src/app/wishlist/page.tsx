"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, fetchWishlist, removeFromWishlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type WishlistItem = Awaited<ReturnType<typeof fetchWishlist>>[number];

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [status, setStatus] = useState("");
  const { showToast } = useToast();

  async function load() {
    try {
      const data = await fetchWishlist();
      setItems(data);
    } catch {
      setStatus("Войдите в аккаунт, чтобы увидеть избранное.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onRemove(productId: string) {
    try {
      const data = await removeFromWishlist(productId);
      setItems(data);
    } catch {
      setStatus("Не удалось удалить товар.");
    }
  }

  async function onMoveToCart(productId: string) {
    const item = items.find((entry) => entry.product.id === productId);
    const defaultVariant = item?.product.variants[0];
    if (!defaultVariant) {
      setStatus("Для товара не настроены размеры.");
      showToast("Для товара не настроены размеры.", "error");
      return;
    }
    try {
      await addToCart(defaultVariant.id, 1);
      showToast("Товар добавлен в корзину");
    } catch {
      setStatus("Не удалось добавить в корзину.");
      showToast("Не удалось добавить в корзину.", "error");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Wishlist</h1>
      <p className="text-sm text-muted-foreground">Избранные товары.</p>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="grid gap-3 p-4">
            <h3 className="font-medium">{item.product.name}</h3>
            <p className="text-sm text-muted-foreground">
              {Number(item.product.price).toLocaleString("ru-RU")} руб
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/catalog/product/${item.product.slug || item.product.id}`}>Карточка</Link>
              </Button>
              <Button size="sm" onClick={() => void onMoveToCart(item.product.id)}>
                В корзину
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onRemove(item.product.id)}
              >
                Удалить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
