"use client";

import { useEffect, useState } from "react";
import {
  Outfit,
  Product,
  addOutfitToCart,
  fetchProducts,
  fetchStylistLooks,
} from "@/lib/api";
import { OutfitPreview } from "@/components/features/outfits/outfit-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Готовые образы от стилистов</h1>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {outfits.map((outfit) => (
        <Card key={outfit.id}>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[190px_1fr] md:items-start">
            <OutfitPreview items={outfit.items} productsById={productsById} width={170} height={230} />
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">{outfit.name}</h3>
              <p className="text-sm text-muted-foreground">{outfit.description || "Без описания."}</p>
              <p className="text-sm">Позиции в образе: {outfit.items.length}</p>
              <Button className="w-fit" onClick={() => void onAddToCart(outfit.id)}>
                Добавить весь образ в корзину
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
