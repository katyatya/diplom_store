"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Product, fetchProducts } from "@/lib/api";
import { getProductHref } from "@/lib/catalog";
import { ProductCardImage } from "@/components/features/catalog/product-card-image";
import { ProductPrice } from "@/components/features/catalog/product-price";

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
              <ProductCardImage
                product={product}
                imageClassName="h-[420px] transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="mt-3 grid gap-1">
                <h2 className="text-sm uppercase tracking-wide">{product.name}</h2>
                <ProductPrice value={product.price} withWord className="text-sm font-medium" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
