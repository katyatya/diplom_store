"use client";

import { useEffect, useState } from "react";
import {
  Outfit,
  Product,
  addOutfitToCart,
  fetchProducts,
  fetchStylistLooks,
} from "@/lib/api";
import { OutfitPreview } from "@/components/outfit-preview";

export default function StylistOutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    void Promise.all([fetchStylistLooks(), fetchProducts()])
      .then(([loadedOutfits, products]) => {
        setOutfits(loadedOutfits);
        setProductsById(
          products.reduce<Record<string, Product>>((acc, product) => {
            acc[product.id] = product;
            return acc;
          }, {}),
        );
      })
      .catch(() => setStatus("Не удалось загрузить образы стилистов."));
  }, []);

  async function onAddToCart(outfitId: string) {
    try {
      await addOutfitToCart(outfitId);
      setStatus("Образ добавлен в корзину как набор товаров.");
    } catch {
      setStatus("Для добавления образа в корзину требуется вход.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Готовые образы от стилистов</h1>
      {status ? <p>{status}</p> : null}
      {outfits.map((outfit) => (
        <article
          key={outfit.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gridTemplateColumns: "190px 1fr",
            gap: 12,
            alignItems: "start",
          }}
        >
          <OutfitPreview items={outfit.items} productsById={productsById} width={170} height={230} />
          <div>
            <h3>{outfit.name}</h3>
            <p>{outfit.description || "Без описания."}</p>
            <p>Позиции в образе: {outfit.items.length}</p>
            <button onClick={() => void onAddToCart(outfit.id)}>Добавить весь образ в корзину</button>
          </div>
        </article>
      ))}
    </section>
  );
}
