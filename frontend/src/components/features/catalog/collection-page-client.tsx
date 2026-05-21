"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Product, addToWishlist, fetchProducts } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";

type CollectionPageClientProps = {
  collectionSlug: string;
};

function prettifyCollectionTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function CollectionPageClient({ collectionSlug }: CollectionPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");

  const collectionTitle = useMemo(
    () => prettifyCollectionTitle(decodeURIComponent(collectionSlug)),
    [collectionSlug],
  );

  useEffect(() => {
    if (!collectionSlug) return;
    void (async () => {
      try {
        const loadedProducts = await fetchProducts({ collectionSlug });
        setProducts(loadedProducts);
        setStatus(loadedProducts.length === 0 ? "В этой коллекции пока нет товаров." : "");
      } catch {
        setProducts([]);
        setStatus("Не удалось загрузить товары коллекции.");
      }
    })();
  }, [collectionSlug]);

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
      <h1 className="text-3xl font-semibold tracking-tight">{collectionTitle}</h1>
      <p className="text-sm text-muted-foreground">
        Товары, отобранные специально для этой рекламной коллекции.
      </p>
      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      <div className="mx-auto grid w-full max-w-4xl gap-x-6 gap-y-10 sm:grid-cols-2">
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
              <div className="overflow-hidden bg-muted/30">
                <img
                  src={getPrimaryProductImage(product)}
                  alt={product.name}
                  className="h-[420px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
