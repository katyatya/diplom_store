"use client";

import { Outfit, Product } from "@/lib/api";

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
        style={{
          width,
          height,
          border: "1px dashed #d0d0d0",
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          color: "#999",
          fontSize: 12,
          backgroundColor: "#fff",
        }}
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
      style={{
        width,
        height,
        position: "relative",
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
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
            src={product.imageUrl}
            alt={product.name}
            style={{
              position: "absolute",
              left,
              top,
              width: itemWidth,
              height: itemHeight,
              transform: `rotate(${item.rotation ?? 0}deg)`,
              transformOrigin: "center center",
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #efefef",
              backgroundColor: "#f8f8f8",
            }}
          />
        );
      })}
    </div>
  );
}
