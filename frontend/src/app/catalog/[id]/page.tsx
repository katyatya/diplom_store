"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Product, addProductToCart, fetchProduct } from "@/lib/api";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    void fetchProduct(params.id)
      .then(setProduct)
      .catch(() => setStatus("Товар не найден."));
  }, [params?.id]);

  async function handleAddToCart() {
    if (!product) return;
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

  if (!product) {
    return <p>{status || "Загрузка..."}</p>;
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <Link href="/catalog">Назад в каталог</Link>
      <h1>{product.name}</h1>
      <img src={product.imageUrl} alt={product.name} style={{ width: "100%", maxWidth: 520, borderRadius: 12 }} />
      <p>Категория: {product.category}</p>
      <p>{product.description || "Описание будет добавлено позже."}</p>
      <p>
        <strong>{Number(product.price).toLocaleString("ru-RU")} руб</strong>
      </p>
      <button style={{ width: "fit-content" }} onClick={() => void handleAddToCart()}>
        Добавить в корзину
      </button>
      {status ? <p>{status}</p> : null}
    </section>
  );
}
