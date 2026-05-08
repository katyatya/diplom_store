"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, fetchWishlist, removeFromWishlist } from "@/lib/api";

type WishlistItem = Awaited<ReturnType<typeof fetchWishlist>>[number];

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [status, setStatus] = useState("");

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
    try {
      await addToCart(productId, 1);
      setStatus("Товар добавлен в корзину.");
    } catch {
      setStatus("Не удалось добавить в корзину.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1>Wishlist</h1>
      <p>Избранные товары.</p>
      {status ? <p>{status}</p> : null}
      {items.map((item) => (
        <article key={item.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 10 }}>
          <h3>{item.product.name}</h3>
          <p>{Number(item.product.price).toLocaleString("ru-RU")} руб</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/catalog/${item.product.id}`}>Карточка</Link>
            <button onClick={() => void onMoveToCart(item.product.id)}>В корзину</button>
            <button onClick={() => void onRemove(item.product.id)}>Удалить</button>
          </div>
        </article>
      ))}
    </section>
  );
}
