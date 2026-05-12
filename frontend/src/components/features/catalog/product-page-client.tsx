"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Product, addProductToCart, fetchProduct } from "@/lib/api";
import { getPrimaryProductImage, getProductImageUrls } from "@/lib/product-images";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type ProductPageClientProps = {
  productSlug: string;
};

export function ProductPageClient({ productSlug }: ProductPageClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [status, setStatus] = useState("");
  const { showToast } = useToast();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!productSlug) return;
    void fetchProduct(productSlug)
      .then((data) => {
        setProduct(data);
        setActiveImageIndex(0);
      })
      .catch(() => setStatus("Товар не найден."));
  }, [productSlug]);

  async function handleAddToCart() {
    if (!product) return;
    try {
      await addProductToCart(product, 1);
      showToast("Товар добавлен в корзину");
    } catch {
      setStatus("Не удалось добавить товар в корзину.");
      showToast("Не удалось добавить товар в корзину.", "error");
    }
  }

  if (!product) {
    return <p className="text-sm text-muted-foreground">{status || "Загрузка..."}</p>;
  }

  const images = getProductImageUrls(product);
  const selectedImage = images[activeImageIndex] ?? images[0] ?? getPrimaryProductImage(product);
  const hasMultipleImages = images.length > 1;

  function goToPreviousImage() {
    if (!hasMultipleImages) return;
    setActiveImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function goToNextImage() {
    if (!hasMultipleImages) return;
    setActiveImageIndex((current) => (current + 1 >= images.length ? 0 : current + 1));
  }

  return (
    <section className="grid gap-4">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/catalog">
        Назад в каталог
      </Link>
      <div className="mx-auto grid w-full max-w-[1120px] gap-6 lg:grid-cols-[76px_560px_320px] lg:items-start lg:gap-8">
        {hasMultipleImages ? (
          <div className="order-2 flex gap-2 overflow-auto lg:order-1 lg:max-h-[620px] lg:flex-col">
            {images.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                aria-label={`Открыть фото ${index + 1}`}
                onClick={() => setActiveImageIndex(index)}
                className="shrink-0 overflow-hidden border"
                style={{
                  borderColor:
                    index === activeImageIndex ? "hsl(var(--foreground))" : "hsl(var(--border))",
                }}
              >
                <img
                  src={imageUrl}
                  alt={`${product.name} ${index + 1}`}
                  className="h-[88px] w-[66px] object-cover lg:h-[96px] lg:w-[72px]"
                />
              </button>
            ))}
          </div>
        ) : null}

        <Card
          className="relative order-1 overflow-hidden rounded-none border-0 shadow-none lg:order-2 lg:w-[560px]"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
          }}
          onTouchEnd={(event) => {
            if (!hasMultipleImages) return;
            const touch = event.changedTouches[0];
            const startX = touchStartX.current;
            const startY = touchStartY.current;
            touchStartX.current = null;
            touchStartY.current = null;
            if (startX === null || startY === null) return;

            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

            if (deltaX > 0) {
              goToPreviousImage();
            } else {
              goToNextImage();
            }
          }}
        >
          <img src={selectedImage} alt={product.name} className="h-auto max-h-[620px] w-full object-cover" />
          {hasMultipleImages ? (
            <>
              <button
                type="button"
                aria-label="Предыдущее фото"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border bg-background/90 px-2 py-1 text-sm"
                onClick={goToPreviousImage}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border bg-background/90 px-2 py-1 text-sm"
                onClick={goToNextImage}
              >
                →
              </button>
            </>
          ) : null}
        </Card>

        <aside className="order-3 grid gap-4 lg:pl-1">
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold uppercase tracking-wide lg:text-[30px]">{product.name}</h1>
            <p className="text-xl font-semibold">{Number(product.price).toLocaleString("ru-RU")} руб</p>
          </div>

          <Button
            className="h-11 w-full rounded-none bg-black text-sm text-white hover:bg-black/90"
            onClick={() => void handleAddToCart()}
          >
            ДОБАВИТЬ В КОРЗИНУ
          </Button>

          <p className="text-sm leading-6 text-muted-foreground">
            {product.description || "Описание будет добавлено позже."}
          </p>

          <div className="grid gap-1 text-sm">
            <p className="font-medium">СОСТАВ</p>
            <p className="text-muted-foreground">{product.composition || "Не указан"}</p>
          </div>
        </aside>
      </div>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </section>
  );
}
