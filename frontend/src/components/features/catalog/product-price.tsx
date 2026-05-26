"use client";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductPriceProps = {
  value: number | string;
  withWord?: boolean;
  className?: string;
};

export function ProductPrice({ value, withWord = false, className }: ProductPriceProps) {
  return <p className={cn(className)}>{formatPrice(value, withWord ? "word" : "symbol")}</p>;
}
