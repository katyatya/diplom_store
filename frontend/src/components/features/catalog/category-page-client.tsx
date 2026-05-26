"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Product, fetchCategories, fetchProducts } from "@/lib/api";
import { findCategoryBySlug } from "@/lib/catalog-categories";
import { getProductHref } from "@/lib/catalog";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCardImage } from "@/components/features/catalog/product-card-image";
import { WishlistButton } from "@/components/features/catalog/wishlist-button";
import { ProductPrice } from "@/components/features/catalog/product-price";

type CategoryPageClientProps = {
  categorySlug: string;
};

export function CategoryPageClient({ categorySlug }: CategoryPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedCategory, setResolvedCategory] = useState<string>("");
  const [pageStatus, setPageStatus] = useState("");
  const { wishlistProductIds, status, setStatus, addProductToWishlist } = useWishlist();

  useEffect(() => {
    if (!categorySlug) return;

    void (async () => {
      try {
        const loadedCategories = await fetchCategories();
        const categoryName = findCategoryBySlug(loadedCategories, categorySlug);
        if (!categoryName) {
          setResolvedCategory("");
          setProducts([]);
          setPageStatus("Категория не найдена.");
          return;
        }

        setResolvedCategory(categoryName);
        const loadedProducts = await fetchProducts({ category: categoryName });
        setProducts(loadedProducts);
        setPageStatus("");
      } catch {
        setProducts([]);
        setPageStatus("Не удалось загрузить товары категории.");
      }
    })();
  }, [categorySlug]);

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

      {pageStatus ? <p className="text-sm text-muted-foreground">{pageStatus}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
                imageClassName="h-[400px] transition-transform duration-500 group-hover:scale-[1.03]"
              >
                <WishlistButton
                  active={wishlistProductIds.has(product.id)}
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-white/80 text-base backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 ${wishlistProductIds.has(product.id) ? "text-red-500 opacity-100" : "text-muted-foreground opacity-0 hover:text-foreground"}`}
                  onClick={() => void addProductToWishlist(product.id)}
                />
              </ProductCardImage>
              <div className="mt-3 grid gap-1">
                <h2 className="text-xs uppercase tracking-wide">{product.name}</h2>
                <ProductPrice value={product.price} className="text-sm font-light text-muted-foreground" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
