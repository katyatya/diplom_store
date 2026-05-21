"use client";

import Link from "next/link";
import { useState } from "react";
import { Product, addProductToCart } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
import { useToast } from "@/components/ui/toast";

type NewProductsGridProps = {
  products: Product[];
};

export function NewProductsGrid({ products }: NewProductsGridProps) {
  const { showToast } = useToast();
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  async function handleAddToCart(product: Product, event: React.MouseEvent) {
    event.preventDefault();
    if (pendingProductId === product.id) return;
    const defaultVariant = product.variants[0];
    if (!defaultVariant) {
      showToast("Для товара не настроены размеры.", "error");
      return;
    }
    setPendingProductId(product.id);
    try {
      await addProductToCart(product, defaultVariant.id, defaultVariant.sizeLabel, 1);
      showToast("Товар добавлен в корзину");
    } catch {
      showToast("Не удалось добавить товар в корзину.", "error");
    } finally {
      setPendingProductId((current) => (current === product.id ? null : current));
    }
  }

  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Новинок пока нет
      </p>
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/catalog/product/${product.slug || product.id}`}
          className="group block"
        >
          <div className="relative overflow-hidden bg-muted/30">
            <img
              src={getPrimaryProductImage(product)}
              alt={product.name}
              className="h-[320px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <button
              type="button"
              aria-label="Добавить в корзину"
              className="absolute inset-x-0 bottom-0 translate-y-full bg-black/90 py-3 text-xs uppercase tracking-[0.15em] text-white transition-transform duration-300 group-hover:translate-y-0"
              onClick={(e) => void handleAddToCart(product, e)}
              disabled={pendingProductId === product.id}
            >
              {pendingProductId === product.id ? "Добавляем..." : "В корзину"}
            </button>
          </div>
          <div className="mt-3 grid gap-1">
            <h3 className="text-xs uppercase tracking-wide">{product.name}</h3>
            <p className="text-sm font-light text-muted-foreground">
              {Number(product.price).toLocaleString("ru-RU")} ₽
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
