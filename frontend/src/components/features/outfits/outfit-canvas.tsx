"use client";

import { useEffect, useMemo, useRef } from "react";
import type Konva from "konva";
import { Image as KonvaImage, Layer, Rect, Stage, Transformer } from "react-konva";
import useImage from "use-image";
import { Product } from "@/lib/api";
import { getPrimaryProductImage } from "@/lib/product-images";

export type CanvasOutfitItem = {
  nodeId: string;
  productId: string;
  x: number;
  y: number;
  zIndex: number;
  width: number;
  height: number;
  rotation: number;
};

type OutfitCanvasProps = {
  width: number;
  height: number;
  productsById: Record<string, Product>;
  items: CanvasOutfitItem[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string | null) => void;
  onChangeItem: (nodeId: string, patch: Partial<CanvasOutfitItem>) => void;
};

type OutfitCanvasNodeProps = {
  item: CanvasOutfitItem;
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasOutfitItem>) => void;
};

function OutfitCanvasNode({
  item,
  product,
  selected,
  onSelect,
  onChange,
}: OutfitCanvasNodeProps) {
  const [image] = useImage(getPrimaryProductImage(product), "anonymous");
  const shapeRef = useRef<Konva.Image | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (!selected || !shapeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          if (!shapeRef.current) return;
          const node = shapeRef.current;
          const nextWidth = Math.max(60, node.width() * node.scaleX());
          const nextHeight = Math.max(60, node.height() * node.scaleY());
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: nextWidth,
            height: nextHeight,
            rotation: node.rotation(),
          });
        }}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 60 || newBox.height < 60) {
              return oldBox;
            }
            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

export function OutfitCanvas({
  width,
  height,
  productsById,
  items,
  selectedNodeId,
  onSelect,
  onChangeItem,
}: OutfitCanvasProps) {
  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.zIndex - right.zIndex),
    [items],
  );

  return (
    <Stage
      width={width}
      height={height}
      style={{
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        backgroundColor: "hsl(var(--card))",
      }}
      onMouseDown={(event) => {
        if (event.target === event.target.getStage()) {
          onSelect(null);
        }
      }}
      onTouchStart={(event) => {
        if (event.target === event.target.getStage()) {
          onSelect(null);
        }
      }}
    >
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill="hsl(220 20% 98%)" />
        {sortedItems.map((item) => {
          const product = productsById[item.productId];
          if (!product) return null;
          return (
            <OutfitCanvasNode
              key={item.nodeId}
              item={item}
              product={product}
              selected={selectedNodeId === item.nodeId}
              onSelect={() => onSelect(item.nodeId)}
              onChange={(patch) => onChangeItem(item.nodeId, patch)}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}
