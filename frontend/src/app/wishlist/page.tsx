"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, fetchWishlist, removeFromWishlist } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
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
      showToast("Для товара не настроены размеры.", "error");
      return;
    }
    try {
      await addToCart(defaultVariant.id, 1);
      showToast("Товар добавлен в корзину");
    } catch {
      showToast("Не удалось добавить в корзину.", "error");
    }
  }

  return (
    <section className="grid gap-8">
      <div className="border-b pb-6">
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Избранное
        </h1>
        {items.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}
          </p>
        ) : null}
      </div>

      {status ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{status}</p>
      ) : null}

      {!status && items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-6 text-muted-foreground">В избранном пока ничего нет</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 border border-foreground px-8 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-white"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : null}

      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group">
            <Link
              href={`/catalog/product/${item.product.slug || item.product.id}`}
              className="block overflow-hidden bg-muted/30"
            >
              <img
                src={getPrimaryProductImage(item.product)}
                alt={item.product.name}
                className="h-[320px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </Link>
            <div className="mt-3 grid gap-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/catalog/product/${item.product.slug || item.product.id}`}
                  className="text-xs uppercase tracking-wide hover:underline"
                >
                  {item.product.name}
                </Link>
                <button
                  type="button"
                  aria-label="Удалить из избранного"
                  className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => void onRemove(item.product.id)}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm font-light text-muted-foreground">
                {Number(item.product.price).toLocaleString("ru-RU")} ₽
              </p>
              <button
                type="button"
                className="w-full border border-foreground py-2 text-xs uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-white"
                onClick={() => void onMoveToCart(item.product.id)}
              >
                В корзину
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
