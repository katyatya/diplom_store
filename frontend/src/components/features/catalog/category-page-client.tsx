"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Product,
  addToWishlist,
  fetchCategories,
  fetchProducts,
} from "@/lib/api";
import { findCategoryBySlug } from "@/lib/catalog-categories";
import { getPrimaryProductImage } from "@/lib/product-images";

type CategoryPageClientProps = {
  categorySlug: string;
};

export function CategoryPageClient({ categorySlug }: CategoryPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedCategory, setResolvedCategory] = useState<string>("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!categorySlug) return;

    void (async () => {
      try {
        const loadedCategories = await fetchCategories();
        const categoryName = findCategoryBySlug(loadedCategories, categorySlug);
        if (!categoryName) {
          setResolvedCategory("");
          setProducts([]);
          setStatus("Категория не найдена.");
          return;
        }

        setResolvedCategory(categoryName);
        const loadedProducts = await fetchProducts({ category: categoryName });
        setProducts(loadedProducts);
        setStatus("");
      } catch {
        setProducts([]);
        setStatus("Не удалось загрузить товары категории.");
      }
    })();
  }, [categorySlug]);

  async function onAddToWishlist(productId: string) {
    try {
      await addToWishlist(productId);
      setStatus("Товар добавлен в избранное.");
    } catch {
      setStatus("Для добавления в избранное требуется вход.");
    }
  }

  return (
    <section className="grid gap-4">
      <Link
        href="/catalog"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        <span>Назад в каталог</span>
      </Link>
      {resolvedCategory ? (
        <h1 className="text-3xl font-semibold tracking-tight">{resolvedCategory}</h1>
      ) : null}
      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      <div className="mx-auto grid w-full max-w-4xl gap-x-6 gap-y-10 sm:grid-cols-2">
        {products.map((product, index) => {
          const isLargeCard = index % 3 === 2;
          const productIdentifier = product.slug || product.id;
          return (
            <article
              key={product.id}
              className={`group cursor-pointer ${isLargeCard ? "sm:col-span-2" : ""}`}
              onClick={() => router.push(`/catalog/product/${productIdentifier}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/catalog/product/${productIdentifier}`);
                }
              }}
              role="link"
              tabIndex={0}
            >
              <div className="overflow-hidden bg-muted/30">
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                    isLargeCard ? "h-[560px]" : "h-[420px]"
                  }`}
                />
              </div>
              <div className="mt-3 grid gap-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm uppercase tracking-wide">{product.name}</h2>
                  <button
                    type="button"
                    aria-label="Добавить в избранное"
                    className="text-lg leading-none text-muted-foreground hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onAddToWishlist(product.id);
                    }}
                  >
                    ♡
                  </button>
                </div>
                <p className="text-sm font-medium">{Number(product.price).toLocaleString("ru-RU")} руб</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
