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
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Каталог</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setActiveCategory("")} disabled={!activeCategory}>
          Все категории
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              backgroundColor: activeCategory === category ? "#222" : "white",
              color: activeCategory === category ? "white" : "black",
            }}
          >
            {category}
          </button>
        ))}
      </div>
      {status ? <p style={{ color: "#2a5" }}>{status}</p> : null}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {products.map((product) => (
          <article key={product.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 10 }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: 180, objectFit: "cover" }} />
            <h3 style={{ marginBottom: 6 }}>{product.name}</h3>
            <p style={{ margin: "4px 0" }}>{product.category}</p>
            <p>{Number(product.price).toLocaleString("ru-RU")} руб</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/catalog/${product.id}`}>Подробнее</Link>
              <button onClick={() => void onAddToCart(product)}>В корзину</button>
              <button onClick={() => void onAddToWishlist(product.id)}>В избранное</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
