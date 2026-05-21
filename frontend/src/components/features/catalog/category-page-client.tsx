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
    <section className="grid gap-8">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <Link href="/catalog" className="transition-colors hover:text-foreground">
          Каталог
        </Link>
        {resolvedCategory ? (
          <>
            <span>/</span>
            <span className="text-foreground">{resolvedCategory}</span>
          </>
        ) : null}
      </div>

      {resolvedCategory ? (
        <div className="border-b pb-6">
          <h1
            className="text-5xl font-light italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {resolvedCategory}
          </h1>
          {products.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {products.length} {products.length === 1 ? "товар" : products.length < 5 ? "товара" : "товаров"}
            </p>
          ) : null}
        </div>
      ) : null}

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const productIdentifier = product.slug || product.id;
          return (
            <article
              key={product.id}
              className="group cursor-pointer"
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
              <div className="relative overflow-hidden bg-muted/30">
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className="h-[400px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <button
                  type="button"
                  aria-label="Добавить в избранное"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-white/80 text-base text-muted-foreground opacity-0 backdrop-blur-sm transition-all duration-200 hover:text-foreground group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onAddToWishlist(product.id);
                  }}
                >
                  ♡
                </button>
              </div>
              <div className="mt-3 grid gap-1">
                <h2 className="text-xs uppercase tracking-wide">{product.name}</h2>
                <p className="text-sm font-light text-muted-foreground">
                  {Number(product.price).toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
