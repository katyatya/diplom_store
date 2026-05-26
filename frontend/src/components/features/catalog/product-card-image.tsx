"use client";

import { ReactNode } from "react";
import { Product } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";
import { cn } from "@/lib/utils";

type ProductCardImageProps = {
  product: Product;
  imageClassName?: string;
  wrapperClassName?: string;
  children?: ReactNode;
};

export function ProductCardImage({
  product,
  imageClassName,
  wrapperClassName,
  children,
}: ProductCardImageProps) {
  return (
    <div className={cn("relative overflow-hidden bg-muted/30", wrapperClassName)}>
      <img
        src={getPrimaryProductImage(product)}
        alt={product.name}
        className={cn("w-full object-cover", imageClassName)}
      />
      {children}
    </div>
  );
}
