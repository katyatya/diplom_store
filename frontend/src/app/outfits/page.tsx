"use client";

import Link from "next/link";
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
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPrimaryProductImage } from "@/lib/product-images";

export default function StylistOutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
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
        <Card
          key={outfit.id}
          className="cursor-pointer transition-colors hover:bg-accent/20"
          onClick={() => setSelectedOutfit(outfit)}
        >
          <CardContent className="grid gap-3 p-4 md:grid-cols-[190px_1fr] md:items-start">
            <OutfitPreview items={outfit.items} productsById={productsById} width={170} height={230} />
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">{outfit.name}</h3>
              <p className="text-sm text-muted-foreground">{outfit.description || "Без описания."}</p>
              <p className="text-sm">Позиции в образе: {outfit.items.length}</p>
              <Button
                className="w-fit"
                onClick={(event) => {
                  event.stopPropagation();
                  void onAddToCart(outfit.id);
                }}
              >
                Добавить весь образ в корзину
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Dialog open={Boolean(selectedOutfit)} onOpenChange={(open) => !open && setSelectedOutfit(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.25rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
          {selectedOutfit ? (
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-3">
                <DialogHeader>
                  <DialogTitle>{selectedOutfit.name}</DialogTitle>
                </DialogHeader>
                <DialogClose asChild>
                  <Button variant="outline" size="sm" className="w-fit sm:hidden">
                    Закрыть
                  </Button>
                </DialogClose>
                <OutfitPreview
                  items={selectedOutfit.items}
                  productsById={productsById}
                  width={280}
                  height={370}
                />
                <p className="text-sm text-muted-foreground">
                  {selectedOutfit.description || "Без описания."}
                </p>
                <p className="text-sm">Позиции в образе: {selectedOutfit.items.length}</p>
                <Button className="w-fit" onClick={() => void onAddToCart(selectedOutfit.id)}>
                  Добавить весь образ в корзину
                </Button>
              </div>
              <aside className="grid max-h-[380px] content-start gap-2 overflow-auto pr-1 md:max-h-[520px]">
                <h3 className="text-base font-semibold">Товары образа</h3>
                {selectedOutfit.items.map((item, index) => {
                  const product = productsById[item.productId];
                  if (!product) return null;
                  return (
                    <Link
                      key={`${item.productId}-${index}`}
                      href={`/catalog/product/${product.slug || product.id}`}
                      className="block rounded-lg border p-2 transition-colors hover:bg-accent/30"
                    >
                      <article className="grid grid-cols-[56px_minmax(0,1fr)] gap-2">
                        <img
                          src={getPrimaryProductImage(product)}
                          alt={product.name}
                          className="h-14 w-14 rounded-md border object-cover"
                        />
                        <div className="grid gap-1">
                          <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(product.price).toLocaleString("ru-RU")} руб
                          </p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </aside>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
