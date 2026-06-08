"use client";

import { useEffect, useMemo, useRef } from "react";
import type Konva from "konva";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import { Product } from "@/lib/api";
import { getOutfitCanvasImage } from "@/lib/product-images";

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
  onRemoveItem: (nodeId: string) => void;
};

type OutfitCanvasNodeProps = {
  item: CanvasOutfitItem;
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasOutfitItem>) => void;
  onRemove: () => void;
};

function OutfitCanvasNode({
  item,
  product,
  selected,
  onSelect,
  onChange,
  onRemove,
}: OutfitCanvasNodeProps) {
  const [image] = useImage(getOutfitCanvasImage(product), "anonymous");
  const groupRef = useRef<Konva.Group | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (!selected || !groupRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([groupRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selected, item.width, item.height, item.rotation]);

  return (
    <>
      <Group
        ref={groupRef}
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => onChange({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          if (!groupRef.current) return;
          const node = groupRef.current;
          const nextWidth = Math.max(60, item.width * node.scaleX());
          const nextHeight = Math.max(60, item.height * node.scaleY());
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
      >
        <KonvaImage image={image} width={item.width} height={item.height} />
        {selected ? (
          <Group
            x={item.width - 6}
            y={-6}
            onClick={(event) => {
              event.cancelBubble = true;
              onRemove();
            }}
            onTap={(event) => {
              event.cancelBubble = true;
              onRemove();
            }}
          >
            <Circle radius={12} fill="#d6ab9a" stroke="#0f4f4b" strokeWidth={1} />
            <Text
              text="×"
              fontSize={18}
              fill="#0f4f4b"
              width={24}
              height={24}
              align="center"
              verticalAlign="middle"
              offsetX={12}
              offsetY={12}
            />
          </Group>
        ) : null}
      </Group>
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
  onRemoveItem,
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
              onRemove={() => onRemoveItem(item.nodeId)}
            />
          );
        })}
      </Layer>
    </Stage>
  );
}
