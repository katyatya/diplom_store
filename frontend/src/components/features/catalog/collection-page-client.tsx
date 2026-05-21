"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Product, fetchProducts } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
import { getProductHref } from "@/lib/catalog";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/format";

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
  const [pageStatus, setPageStatus] = useState("");
  const { wishlistProductIds, status, addProductToWishlist } = useWishlist();

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
        setPageStatus(loadedProducts.length === 0 ? "В этой коллекции пока нет товаров." : "");
      } catch {
        setProducts([]);
        setPageStatus("Не удалось загрузить товары коллекции.");
      }
    })();
  }, [collectionSlug]);

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
      {pageStatus ? <p className="text-sm text-emerald-600">{pageStatus}</p> : null}
      {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
      <div className="mx-auto grid w-full max-w-4xl gap-x-6 gap-y-10 sm:grid-cols-2">
        {products.map((product) => {
          const productHref = getProductHref(product);
          return (
            <article
              key={product.id}
              className="group cursor-pointer"
              onClick={() => router.push(productHref)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(productHref);
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
                    className={`text-lg leading-none ${wishlistProductIds.has(product.id) ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void addProductToWishlist(product.id);
                    }}
                  >
                    ♡
                  </button>
                </div>
                <p className="text-sm font-medium">{formatPrice(product.price, "word")}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
