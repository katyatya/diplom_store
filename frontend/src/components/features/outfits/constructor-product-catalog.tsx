"use client";

import { type DragEvent as ReactDragEvent } from "react";
import { Product } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";

type ConstructorProductCatalogProps = {
  categories: string[];
  selectedCategory: string;
  visibleProducts: Product[];
  onSelectCategory: (category: string) => void;
  onAddProduct: (product: Product) => void;
  onProductDragStart: (event: ReactDragEvent<HTMLElement>, productId: string) => void;
};

export function ConstructorProductCatalog({
  categories,
  selectedCategory,
  visibleProducts,
  onSelectCategory,
  onAddProduct,
  onProductDragStart,
}: ConstructorProductCatalogProps) {
  return (
    <div className="grid max-h-[620px] gap-3 overflow-hidden border p-3">
      <p className="text-xs uppercase tracking-[0.15em]">Каталог товаров</p>
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[130px_minmax(0,1fr)]">
        <aside className="grid content-start gap-1 overflow-auto">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`border px-2 py-1.5 text-left text-xs uppercase tracking-wide transition-colors ${
                selectedCategory === category
                  ? "border-foreground bg-foreground text-white"
                  : "hover:bg-muted/60"
              }`}
            >
              {category}
            </button>
          ))}
        </aside>

        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1 [scrollbar-color:hsl(var(--muted-foreground))_hsl(var(--muted))] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-muted/50">
          {visibleProducts.length === 0 ? (
            <p className="py-4 text-xs text-muted-foreground">Нет товаров в этой категории.</p>
          ) : (
            visibleProducts.map((product) => (
              <article
                key={product.id}
                onClick={() => onAddProduct(product)}
                draggable
                onDragStart={(event) => onProductDragStart(event, product.id)}
                className="flex cursor-pointer items-center gap-3 border p-2 transition-colors hover:bg-muted/40"
              >
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 object-cover"
                />
                <div className="min-w-0 grid gap-1">
                  <span className="line-clamp-2 text-xs leading-snug">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
