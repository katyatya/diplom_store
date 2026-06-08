"use client";

import { Outfit, Product } from "@/lib/api";
import { getOutfitCanvasImage } from "@/lib/product-images";

type OutfitPreviewProps = {
  items: Outfit["items"];
  productsById: Record<string, Product>;
  width?: number;
  height?: number;
};

const FALLBACK_ITEM_WIDTH = 90;
const FALLBACK_ITEM_HEIGHT = 120;

export function OutfitPreview({
  items,
  productsById,
  width = 170,
  height = 230,
}: OutfitPreviewProps) {
  const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

  if (sortedItems.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-lg border border-dashed bg-card text-xs text-muted-foreground"
        style={{ width, height }}
      >
        Без позиций
      </div>
    );
  }

  const minX = Math.min(...sortedItems.map((item) => item.x));
  const minY = Math.min(...sortedItems.map((item) => item.y));
  const maxX = Math.max(
    ...sortedItems.map((item) => item.x + (item.width ?? FALLBACK_ITEM_WIDTH)),
  );
  const maxY = Math.max(
    ...sortedItems.map((item) => item.y + (item.height ?? FALLBACK_ITEM_HEIGHT)),
  );
  const sourceWidth = Math.max(1, maxX - minX);
  const sourceHeight = Math.max(1, maxY - minY);

  const scale = Math.min((width - 16) / sourceWidth, (height - 16) / sourceHeight);
  const offsetX = (width - sourceWidth * scale) / 2;
  const offsetY = (height - sourceHeight * scale) / 2;

  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-card"
      style={{ width, height }}
    >
      {sortedItems.map((item, index) => {
        const product = productsById[item.productId];
        if (!product) return null;

        const itemWidth = (item.width ?? FALLBACK_ITEM_WIDTH) * scale;
        const itemHeight = (item.height ?? FALLBACK_ITEM_HEIGHT) * scale;
        const left = offsetX + (item.x - minX) * scale;
        const top = offsetY + (item.y - minY) * scale;

        return (
          <img
            key={`${item.productId}-${index}`}
            src={getOutfitCanvasImage(product)}
            alt={product.name}
            style={{
              position: "absolute",
              left,
              top,
              width: itemWidth,
              height: itemHeight,
              transform: `rotate(${item.rotation ?? 0}deg)`,
              transformOrigin: "center center",
              objectFit: "contain",
            }}
          />
        );
      })}
    </div>
  );
}
