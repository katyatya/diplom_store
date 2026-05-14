"use client";

import {
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Outfit,
  Product,
  addOutfitToCart,
  adminCreateStylistLook,
  adminDeleteStylistLook,
  adminFetchStylistLooks,
  adminUpdateStylistLook,
  createOutfit,
  deleteOutfit,
  fetchCategories,
  fetchMe,
  fetchMyOutfits,
  fetchProducts,
  updateOutfit,
} from "@/lib/api";
import { requestAuthRequired } from "@/lib/auth-required";
import { getPrimaryProductImage } from "@/lib/product-images";
import { OutfitPreview } from "@/components/features/outfits/outfit-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const CANVAS_WIDTH = 430;
const CANVAS_HEIGHT = 620;
const DEFAULT_ITEM_WIDTH = 160;
const DEFAULT_ITEM_HEIGHT = 220;

type OutfitPlacement = Outfit["items"][number];
type CanvasOutfitItem = {
  nodeId: string;
  productId: string;
  x: number;
  y: number;
  zIndex: number;
  width: number;
  height: number;
  rotation: number;
};

type ConstructorEditorProps = {
  initialProductId?: string;
  mode?: "user" | "adminStylist";
};

function normalizeOutfitItems(items: Outfit["items"]): CanvasOutfitItem[] {
  return items.map((item, index) => ({
    nodeId: `${item.productId}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    productId: item.productId,
    x: item.x,
    y: item.y,
    zIndex: item.zIndex,
    width: item.width ?? DEFAULT_ITEM_WIDTH,
    height: item.height ?? DEFAULT_ITEM_HEIGHT,
    rotation: item.rotation ?? 0,
  }));
}

function toApiPayload(items: CanvasOutfitItem[]): OutfitPlacement[] {
  return items.map((item, index) => ({
    productId: item.productId,
    x: item.x,
    y: item.y,
    zIndex: index + 1,
    width: item.width,
    height: item.height,
    rotation: item.rotation,
  }));
}

export function ConstructorEditor({ initialProductId, mode = "user" }: ConstructorEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [myOutfits, setMyOutfits] = useState<Outfit[]>([]);
  const [stylistUserId, setStylistUserId] = useState<string>("");
  const [canvasItems, setCanvasItems] = useState<CanvasOutfitItem[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const { showToast } = useToast();
  const dragStateRef = useRef<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    itemX: number;
    itemY: number;
  } | null>(null);
  const handledInitialProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    void fetchProducts().then(setProducts).catch(() => setProducts([]));
    void fetchCategories().then(setCategories).catch(() => setCategories([]));
    void loadOutfits();
    if (mode === "adminStylist") {
      void fetchMe()
        .then((me) => setStylistUserId(me.sub))
        .catch(() => setStylistUserId(""));
    }
  }, [mode]);

  async function loadOutfits() {
    if (mode === "adminStylist") {
      try {
        const data = await adminFetchStylistLooks();
        setMyOutfits(data);
      } catch {
        setStatus("Не удалось загрузить образы стилиста.");
      }
      return;
    }

    try {
      const data = await fetchMyOutfits();
      setMyOutfits(data);
    } catch {
      setStatus("Войдите в аккаунт, чтобы работать с Моими образами.");
    }
  }

  const productsById = useMemo(
    () =>
      products.reduce<Record<string, Product>>((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {}),
    [products],
  );

  const selectedItem = useMemo(
    () => canvasItems.find((item) => item.nodeId === selectedNodeId) ?? null,
    [canvasItems, selectedNodeId],
  );

  const visibleProducts = useMemo(
    () =>
      selectedCategory === "ALL"
        ? products
        : products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory],
  );

  useEffect(() => {
    if (!initialProductId || products.length === 0) return;
    if (handledInitialProductIdRef.current === initialProductId) return;
    const targetProduct = productsById[initialProductId];
    if (!targetProduct) return;
    addProductToCanvas(targetProduct);
    handledInitialProductIdRef.current = initialProductId;
  }, [initialProductId, products.length, productsById]);

  function addProductToCanvas(product: Product) {
    setCanvasItems((current) => [
      ...current,
      {
        nodeId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId: product.id,
        x: 120 + (current.length % 3) * 16,
        y: 50 + (current.length % 3) * 22,
        zIndex: current.length + 1,
        width: DEFAULT_ITEM_WIDTH,
        height: DEFAULT_ITEM_HEIGHT,
        rotation: 0,
      },
    ]);
  }

  function addProductToCanvasAtPosition(product: Product, x: number, y: number) {
    const boundedX = Math.max(0, Math.min(x, CANVAS_WIDTH - DEFAULT_ITEM_WIDTH));
    const boundedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT));
    setCanvasItems((current) => [
      ...current,
      {
        nodeId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId: product.id,
        x: boundedX,
        y: boundedY,
        zIndex: current.length + 1,
        width: DEFAULT_ITEM_WIDTH,
        height: DEFAULT_ITEM_HEIGHT,
        rotation: 0,
      },
    ]);
  }

  function onProductDragStart(event: ReactDragEvent<HTMLElement>, productId: string) {
    event.dataTransfer.setData("text/plain", productId);
    event.dataTransfer.effectAllowed = "copy";
  }

  function onCanvasDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const productId = event.dataTransfer.getData("text/plain");
    if (!productId) return;
    const product = productsById[productId];
    if (!product) return;
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const dropX = event.clientX - canvasRect.left - DEFAULT_ITEM_WIDTH / 2;
    const dropY = event.clientY - canvasRect.top - DEFAULT_ITEM_HEIGHT / 2;
    addProductToCanvasAtPosition(product, dropX, dropY);
  }

  function updateCanvasItem(nodeId: string, patch: Partial<CanvasOutfitItem>) {
    setCanvasItems((current) =>
      current.map((item) => (item.nodeId === nodeId ? { ...item, ...patch } : item)),
    );
  }

  function onCanvasItemMouseDown(
    event: ReactMouseEvent<HTMLImageElement>,
    item: CanvasOutfitItem,
  ) {
    event.preventDefault();
    setSelectedNodeId(item.nodeId);

    const containerRect = (
      event.currentTarget.closest("#outfit-constructor-canvas") as HTMLDivElement | null
    )?.getBoundingClientRect();
    if (!containerRect) return;

    dragStateRef.current = {
      nodeId: item.nodeId,
      offsetX: event.clientX - containerRect.left - item.x,
      offsetY: event.clientY - containerRect.top - item.y,
    };
  }

  function onResizeHandleMouseDown(
    event: ReactMouseEvent<HTMLButtonElement>,
    item: CanvasOutfitItem,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedNodeId(item.nodeId);
    resizeStateRef.current = {
      nodeId: item.nodeId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: item.width,
      startHeight: item.height,
      itemX: item.x,
      itemY: item.y,
    };
  }

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      const resize = resizeStateRef.current;
      if (resize) {
        const deltaX = event.clientX - resize.startX;
        const deltaY = event.clientY - resize.startY;
        const maxWidth = CANVAS_WIDTH - resize.itemX;
        const maxHeight = CANVAS_HEIGHT - resize.itemY;
        updateCanvasItem(resize.nodeId, {
          width: Math.max(60, Math.min(maxWidth, resize.startWidth + deltaX)),
          height: Math.max(60, Math.min(maxHeight, resize.startHeight + deltaY)),
        });
        return;
      }

      const drag = dragStateRef.current;
      if (!drag) return;
      const canvas = document.getElementById("outfit-constructor-canvas");
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const nextX = event.clientX - rect.left - drag.offsetX;
      const nextY = event.clientY - rect.top - drag.offsetY;

      updateCanvasItem(drag.nodeId, {
        x: Math.max(0, Math.min(nextX, CANVAS_WIDTH - 40)),
        y: Math.max(0, Math.min(nextY, CANVAS_HEIGHT - 40)),
      });
    }

    function onMouseUp() {
      dragStateRef.current = null;
      resizeStateRef.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function removeSelectedItem() {
    if (!selectedNodeId) return;
    setCanvasItems((current) => current.filter((item) => item.nodeId !== selectedNodeId));
    setSelectedNodeId(null);
  }

  function removeItemFromCanvas(nodeId: string) {
    setCanvasItems((current) => current.filter((item) => item.nodeId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }

  function bringSelectedForward() {
    if (!selectedNodeId) return;
    setCanvasItems((current) => {
      const ordered = [...current].sort((a, b) => a.zIndex - b.zIndex);
      const index = ordered.findIndex((item) => item.nodeId === selectedNodeId);
      if (index < 0 || index === ordered.length - 1) return current;
      const temp = ordered[index];
      ordered[index] = ordered[index + 1];
      ordered[index + 1] = temp;
      return ordered.map((item, idx) => ({ ...item, zIndex: idx + 1 }));
    });
  }

  function sendSelectedBackward() {
    if (!selectedNodeId) return;
    setCanvasItems((current) => {
      const ordered = [...current].sort((a, b) => a.zIndex - b.zIndex);
      const index = ordered.findIndex((item) => item.nodeId === selectedNodeId);
      if (index <= 0) return current;
      const temp = ordered[index];
      ordered[index] = ordered[index - 1];
      ordered[index - 1] = temp;
      return ordered.map((item, idx) => ({ ...item, zIndex: idx + 1 }));
    });
  }

  function resetDraft() {
    setEditingOutfitId(null);
    setName("");
    setDescription("");
    setCanvasItems([]);
    setSelectedNodeId(null);
  }

  function loadOutfitToCanvas(outfit: Outfit) {
    setEditingOutfitId(outfit.id);
    setName(outfit.name);
    setDescription(outfit.description ?? "");
    setCanvasItems(normalizeOutfitItems(outfit.items));
    setSelectedNodeId(null);
  }

  async function onSaveOutfit() {
    if (mode === "user") {
      try {
        await fetchMe();
      } catch {
        setStatus("Войдите в аккаунт, чтобы работать с Моими образами.");
        requestAuthRequired(showToast, "outfitSave");
        return;
      }
    }

    if (!name.trim() || canvasItems.length === 0) {
      setStatus("Введите название и добавьте хотя бы 1 товар на полотно.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      items: toApiPayload(canvasItems),
    };

    try {
      if (mode === "adminStylist") {
        if (!stylistUserId) {
          setStatus("Не удалось определить admin-пользователя.");
          return;
        }
        if (editingOutfitId) {
          await adminUpdateStylistLook(editingOutfitId, {
            ...payload,
            stylistUserId,
          });
          setStatus("Образ стилиста обновлен.");
        } else {
          await adminCreateStylistLook({
            ...payload,
            stylistUserId,
          });
          setStatus("Образ стилиста сохранен.");
        }
      } else {
        if (editingOutfitId) {
          await updateOutfit(editingOutfitId, payload);
          setStatus("Образ обновлен.");
        } else {
          await createOutfit(payload);
          setStatus("Образ сохранен в Моих образах.");
        }
      }
      resetDraft();
      await loadOutfits();
    } catch {
      setStatus(
        mode === "adminStylist"
          ? "Не удалось сохранить образ стилиста."
          : "Не удалось сохранить образ. Проверьте авторизацию.",
      );
      if (mode === "user") {
        requestAuthRequired(showToast, "outfitSave");
      }
    }
  }

  async function onDeleteOutfit(outfitId: string) {
    try {
      if (mode === "adminStylist") {
        await adminDeleteStylistLook(outfitId);
        setStatus("Образ стилиста удален.");
      } else {
        await deleteOutfit(outfitId);
        setStatus("Образ удален.");
      }
      if (editingOutfitId === outfitId) {
        resetDraft();
      }
      await loadOutfits();
    } catch {
      setStatus("Не удалось удалить образ.");
    }
  }

  async function onAddOutfitToCart(outfitId: string) {
    try {
      await addOutfitToCart(outfitId);
      setStatus("Образ добавлен в корзину.");
    } catch {
      setStatus("Не удалось добавить образ в корзину.");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {mode === "adminStylist" ? "Конструктор образов стилиста" : "Конструктор образов"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {mode === "adminStylist"
          ? "Собирайте образы в конструкторе и сохраняйте их как образы от стилиста."
          : 'Добавляйте товары из каталога на полотно, меняйте их размер и позицию, затем сохраняйте образ в "Мои образы".'}
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{editingOutfitId ? "Редактирование образа" : "Новый образ"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid max-w-[420px] gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название образа"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (необязательно)"
            />
          </div>

          <div className="mt-3 grid items-start gap-4 xl:grid-cols-[390px_minmax(460px,1fr)_260px]">
            <div className="grid max-h-[620px] gap-3 overflow-hidden rounded-lg border p-3">
              <strong>Товары из каталога</strong>
              <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[145px_minmax(0,1fr)]">
                <aside className="grid content-start gap-2 overflow-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("ALL")}
                    className={`rounded-md border px-2 py-1 text-left text-sm transition-colors ${
                      selectedCategory === "ALL"
                        ? "border-foreground bg-accent/40"
                        : "hover:bg-accent/30"
                    }`}
                  >
                    Все категории
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-md border px-2 py-1 text-left text-sm transition-colors ${
                        selectedCategory === category
                          ? "border-foreground bg-accent/40"
                          : "hover:bg-accent/30"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </aside>

                <div className="grid auto-rows-[96px] content-start gap-2 overflow-y-scroll pr-1 [max-height:calc(4*96px+3*0.5rem)] [scrollbar-color:hsl(var(--muted-foreground))_hsl(var(--muted))] [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-muted/50">
                  {visibleProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">В этой категории пока нет товаров.</p>
                  ) : null}
                  {visibleProducts.map((product) => (
                    <article
                      key={product.id}
                      onClick={() => addProductToCanvas(product)}
                      draggable
                      onDragStart={(event) => onProductDragStart(event, product.id)}
                      className="grid h-full cursor-pointer gap-2 rounded-lg border p-2 transition-colors hover:bg-accent/30 md:grid-cols-[64px_minmax(0,1fr)]"
                    >
                      <img
                        src={getPrimaryProductImage(product)}
                        alt={product.name}
                        className="h-16 w-16 rounded-md border object-cover"
                      />
                      <div className="grid gap-2">
                        <span className="line-clamp-2">{product.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {Number(product.price).toLocaleString("ru-RU")} руб
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div
              id="outfit-constructor-canvas"
              className="relative mx-auto overflow-hidden rounded-lg border bg-card xl:mx-0"
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={onCanvasDrop}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedNodeId(null);
                }
              }}
            >
              {canvasItems
                .slice()
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((item) => {
                  const product = productsById[item.productId];
                  if (!product) return null;
                  return (
                    <div
                      key={item.nodeId}
                      style={{
                        position: "absolute",
                        left: item.x,
                        top: item.y,
                        width: item.width,
                        height: item.height,
                        transform: `rotate(${item.rotation}deg)`,
                      }}
                    >
                      <img
                        src={getPrimaryProductImage(product)}
                        alt={product.name}
                        draggable={false}
                        onMouseDown={(event) => onCanvasItemMouseDown(event, item)}
                        onClick={() => setSelectedNodeId(item.nodeId)}
                        className="block h-full w-full select-none rounded-md object-cover"
                        style={{
                          cursor: "grab",
                          border:
                            selectedNodeId === item.nodeId
                              ? "2px solid hsl(var(--foreground))"
                              : "1px solid hsl(var(--border))",
                        }}
                      />
                      {selectedNodeId === item.nodeId ? (
                        <button
                          type="button"
                          aria-label="Изменить размер"
                          onMouseDown={(event) => onResizeHandleMouseDown(event, item)}
                          className="absolute -bottom-2 -right-2 h-[18px] w-[18px] cursor-nwse-resize rounded-sm border border-foreground bg-card"
                        />
                      ) : null}
                      {selectedNodeId === item.nodeId ? (
                        <button
                          type="button"
                          aria-label="Удалить с полотна"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeItemFromCanvas(item.nodeId);
                          }}
                          className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-destructive bg-white text-sm font-semibold leading-none text-destructive transition-colors hover:bg-destructive hover:text-red-500"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  );
                })}
            </div>

            <aside className="grid gap-2 rounded-lg border p-3">
              <strong>Настройки</strong>
              {selectedItem ? (
                <>
                  <label className="grid gap-1 text-sm">
                    Поворот
                    <input
                      className="accent-primary"
                      type="range"
                      min={-180}
                      max={180}
                      value={Math.round(selectedItem.rotation)}
                      onChange={(event) =>
                        updateCanvasItem(selectedItem.nodeId, {
                          rotation: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={bringSelectedForward}>
                      ↑ Слой выше
                    </Button>
                    <Button size="sm" variant="secondary" onClick={sendSelectedBackward}>
                      ↓ Слой ниже
                    </Button>
                    <Button size="sm" variant="ghost" onClick={removeSelectedItem}>
                      Удалить с полотна
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Выберите товар на полотне для изменения размера и размещения.
                </p>
              )}
            </aside>
          </div>

          <p className="text-sm text-muted-foreground">Товаров на полотне: {canvasItems.length}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void onSaveOutfit()}
              className="bg-[#bcefea] font-semibold text-[#0f4f4b] shadow-sm hover:bg-pink-300"
            >
              {mode === "adminStylist" ? "Сохранить образ стилиста" : 'Сохранить в "Мои образы"'}
            </Button>
            <Button variant="outline" onClick={resetDraft}>
              Очистить полотно
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{mode === "adminStylist" ? "Образы стилиста" : "Мои образы"}</CardTitle>
        </CardHeader>
        <CardContent>
          {myOutfits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {mode === "adminStylist"
                ? "Пока нет сохраненных образов стилиста."
                : "Пока нет сохраненных образов."}
            </p>
          ) : null}
          <div className="grid gap-3">
            {myOutfits.map((outfit) => (
              <article
                key={outfit.id}
                className="grid gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr] md:items-start"
              >
                <OutfitPreview items={outfit.items} productsById={productsById} width={160} height={220} />
                <div className="grid gap-1">
                  <strong>{outfit.name}</strong>
                  <p className="text-sm text-muted-foreground">{outfit.description || "Без описания"}</p>
                  <p className="text-sm text-muted-foreground">Позиции: {outfit.items.length}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => loadOutfitToCanvas(outfit)}>
                      Открыть в конструкторе
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void onDeleteOutfit(outfit.id)}>
                      Удалить
                    </Button>
                    {mode === "user" ? (
                      <Button size="sm" onClick={() => void onAddOutfitToCart(outfit.id)}>
                        Добавить в корзину
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </section>
  );
}
