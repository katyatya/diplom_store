"use client";

import { Product } from "@/lib/api";

const URL_SEPARATOR_REGEX = /[\n,;]+/;
const FALLBACK_IMAGE_URL = "https://placehold.co/800x1000?text=No+Image";

function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("images.unsplash.com") && !trimmed.includes("?")) {
    return `${trimmed}?auto=format&fit=crop&w=1200&q=80`;
  }
  return trimmed;
}

export function getProductImageUrls(product: Pick<Product, "imageUrl">): string[] {
  const raw = product.imageUrl?.trim();
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .map(normalizeImageUrl)
          .filter(Boolean);
      }
    } catch {
      // Fall back to delimiter-based parsing.
    }
  }

  return raw
    .split(URL_SEPARATOR_REGEX)
    .map(normalizeImageUrl)
    .filter(Boolean);
}

export function getPrimaryProductImage(product: Pick<Product, "imageUrl">): string {
  return getProductImageUrls(product)[0] ?? FALLBACK_IMAGE_URL;
}
