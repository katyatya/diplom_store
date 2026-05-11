"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Product, addProductToCart, fetchProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    return <p className="text-sm text-muted-foreground">{status || "Загрузка..."}</p>;
  }

  return (
    <section className="grid gap-4">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/catalog">
        Назад в каталог
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
      <Card className="w-full max-w-2xl overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-[420px] w-full object-cover"
        />
      </Card>
      <p className="text-sm text-muted-foreground">Категория: {product.category}</p>
      <p className="max-w-2xl">{product.description || "Описание будет добавлено позже."}</p>
      <p>
        <strong>{Number(product.price).toLocaleString("ru-RU")} руб</strong>
      </p>
      <Button className="w-fit" onClick={() => void handleAddToCart()}>
        Добавить в корзину
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </section>
  );
}
