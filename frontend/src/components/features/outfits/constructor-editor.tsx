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

function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const text = error.message.toLowerCase();
  return text.includes("401") || text.includes("unauthorized");
}

export function ConstructorEditor({ initialProductId, mode = "user" }: ConstructorEditorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [myOutfits, setMyOutfits] = useState<Outfit[]>([]);
  const [pendingCartOutfitId, setPendingCartOutfitId] = useState<string | null>(null);
  const [stylistUserId, setStylistUserId] = useState<string>("");
  const [canvasItems, setCanvasItems] = useState<CanvasOutfitItem[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
        showToast("Не удалось загрузить образы стилиста.", "error");
      }
      return;
    }

    try {
      await fetchMe();
      const data = await fetchMyOutfits();
      setMyOutfits(data);
    } catch {
      setMyOutfits([]);
      showToast("Войдите в аккаунт, чтобы работать с Моими образами.", "error");
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
        requestAuthRequired(showToast, "outfitSave");
        return;
      }
    }

    if (!name.trim() || canvasItems.length === 0) {
      showToast("Введите название и добавьте хотя бы 1 товар на полотно.", "error");
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
          showToast("Не удалось определить admin-пользователя.", "error");
          return;
        }
        if (editingOutfitId) {
          await adminUpdateStylistLook(editingOutfitId, {
            ...payload,
            stylistUserId,
          });
          showToast("Образ стилиста обновлен.");
        } else {
          await adminCreateStylistLook({
            ...payload,
            stylistUserId,
          });
          showToast("Образ стилиста сохранен.");
        }
      } else {
        if (editingOutfitId) {
          await updateOutfit(editingOutfitId, payload);
          showToast("Образ обновлен.");
        } else {
          await createOutfit(payload);
          showToast("Образ сохранен в Моих образах.");
        }
      }
      resetDraft();
      await loadOutfits();
    } catch (error) {
      if (mode === "user" && isAuthError(error)) {
        requestAuthRequired(showToast, "outfitSave");
        return;
      }
      const message =
        mode === "adminStylist"
          ? "Не удалось сохранить образ стилиста."
          : "Не удалось сохранить образ.";
      showToast(message, "error");
    }
  }

  async function onDeleteOutfit(outfitId: string) {
    try {
      if (mode === "adminStylist") {
        await adminDeleteStylistLook(outfitId);
        showToast("Образ стилиста удален.");
      } else {
        await deleteOutfit(outfitId);
        showToast("Образ удален.");
      }
      if (editingOutfitId === outfitId) {
        resetDraft();
      }
      await loadOutfits();
    } catch {
      showToast("Не удалось удалить образ.", "error");
    }
  }

  async function onAddOutfitToCart(outfitId: string) {
    if (pendingCartOutfitId === outfitId) return;
    setPendingCartOutfitId(outfitId);
    try {
      await addOutfitToCart(outfitId);
      showToast("Образ добавлен в корзину.");
    } catch {
      showToast("Не удалось добавить образ в корзину.", "error");
    } finally {
      setPendingCartOutfitId((current) => (current === outfitId ? null : current));
    }
  }

  return (
    <section className="grid gap-8">
      <div className="border-b pb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {mode === "adminStylist" ? "Стилист" : "Персонализация"}
        </p>
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {mode === "adminStylist" ? "Образы стилиста" : "Конструктор образов"}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {mode === "adminStylist"
            ? "Создавайте образы и публикуйте их в разделе готовых образов."
            : "Перетащите товары из каталога на полотно, настройте размер и сохраните образ."}
        </p>
      </div>

      {/* Editor card */}
      <div className="border p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em]">
            {editingOutfitId ? "Редактирование образа" : "Новый образ"}
          </h2>
          {editingOutfitId ? (
            <button
              type="button"
              onClick={resetDraft}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Создать новый
            </button>
          ) : null}
        </div>

        <div className="grid max-w-[420px] gap-3 mb-6">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название образа"
            className="h-11"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            className="h-11"
          />
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(430px,1fr)_240px]">
          {/* Product catalog */}
          <div className="grid max-h-[620px] gap-3 overflow-hidden border p-3">
            <p className="text-xs uppercase tracking-[0.15em]">Каталог товаров</p>
            <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[130px_minmax(0,1fr)]">
              <aside className="grid content-start gap-1 overflow-auto">
                
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`border px-2 py-1.5 text-left text-xs uppercase tracking-wide transition-colors ${
                      selectedCategory === category
                        ? "border-foreground bg-foreground text-white"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </aside>

              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1 [scrollbar-color:hsl(var(--muted-foreground))_hsl(var(--muted))] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-muted/50">
                {visibleProducts.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">Нет товаров в этой категории.</p>
                ) : (
                  visibleProducts.map((product) => (
                    <article
                      key={product.id}
                      onClick={() => addProductToCanvas(product)}
                      draggable
                      onDragStart={(event) => onProductDragStart(event, product.id)}
                      className="flex cursor-pointer items-center gap-3 border p-2 transition-colors hover:bg-muted/40"
                    >
                      <img
                        src={getPrimaryProductImage(product)}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 object-cover"
                      />
                      <div className="min-w-0 grid gap-1">
                        <span className="line-clamp-2 text-xs leading-snug">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {Number(product.price).toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div
            id="outfit-constructor-canvas"
            className="relative mx-auto overflow-hidden border bg-[#fafafa] xl:mx-0"
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
            {canvasItems.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50">
                  Перетащите товары сюда
                </p>
              </div>
            ) : null}
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
                      className="block h-full w-full select-none object-cover"
                      style={{
                        cursor: "grab",
                        outline:
                          selectedNodeId === item.nodeId
                            ? "2px solid hsl(var(--foreground))"
                            : "none",
                      }}
                    />
                    {selectedNodeId === item.nodeId ? (
                      <button
                        type="button"
                        aria-label="Изменить размер"
                        onMouseDown={(event) => onResizeHandleMouseDown(event, item)}
                        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize bg-foreground"
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
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-foreground text-xs text-white transition-opacity hover:opacity-80"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                );
              })}
          </div>

          {/* Settings panel */}
          <aside className="grid gap-4 border p-4">
            <p className="text-xs uppercase tracking-[0.15em]">Настройки</p>
            {selectedItem ? (
              <>
                <label className="grid gap-2 text-xs text-muted-foreground">
                  Поворот: {Math.round(selectedItem.rotation)}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={Math.round(selectedItem.rotation)}
                    className="w-full accent-foreground"
                    onChange={(event) =>
                      updateCanvasItem(selectedItem.nodeId, {
                        rotation: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={bringSelectedForward}
                    className="border px-3 py-2 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
                  >
                    ↑ Слой выше
                  </button>
                  <button
                    type="button"
                    onClick={sendSelectedBackward}
                    className="border px-3 py-2 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
                  >
                    ↓ Слой ниже
                  </button>
                  <button
                    type="button"
                    onClick={removeSelectedItem}
                    className="border border-foreground/20 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    Удалить
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Нажмите на товар на полотне, чтобы изменить его параметры.
              </p>
            )}
          </aside>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {canvasItems.length === 0 ? "Полотно пустое" : `Товаров на полотне: ${canvasItems.length}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-10 text-xs uppercase tracking-[0.1em]"
              onClick={resetDraft}
            >
              Очистить
            </Button>
            <Button
       
              className="h-10 text-xs uppercase tracking-[0.1em] bg-[#d6ab9a] text-[#0f4f4b] hover:bg-[#e8cec4]"
              onClick={() => void onSaveOutfit()}
            >
              {mode === "adminStylist" ? "Сохранить образ стилиста" : "Сохранить образ"}
            </Button>
          </div>
        </div>
      </div>

      {/* Saved outfits */}
      <div className="grid gap-6">
        <div className="flex items-end justify-between border-b pb-4">
          <h2
            className="text-3xl font-light italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {mode === "adminStylist" ? "Образы стилиста" : "Мои образы"}
          </h2>
          <span className="text-xs text-muted-foreground">{myOutfits.length} образов</span>
        </div>

        {myOutfits.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {mode === "adminStylist" ? "Пока нет образов стилиста." : "Пока нет сохранённых образов."}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myOutfits.map((outfit) => (
            <article key={outfit.id} className="group border p-4 grid gap-3">
              <OutfitPreview items={outfit.items} productsById={productsById} width={160} height={220} />
              <div className="grid gap-1">
                <p className="text-xs uppercase tracking-wide font-medium">{outfit.name}</p>
                <p className="text-xs text-muted-foreground">{outfit.description || "Без описания"}</p>
                <p className="text-xs text-muted-foreground">{outfit.items.length} поз.</p>
              </div>
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
                    onClick={() => loadOutfitToCanvas(outfit)}
                  >
                    Изменить
                  </button>
                  {mode === "user" ? (
                    <button
                      type="button"
                      className="border border-black bg-black px-3 py-1.5 text-xs uppercase tracking-wide text-white transition-opacity hover:opacity-80"
                      onClick={() => void onAddOutfitToCart(outfit.id)}
                      disabled={pendingCartOutfitId === outfit.id}
                    >
                      {pendingCartOutfitId === outfit.id ? "Добавляем..." : "В корзину"}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => void onDeleteOutfit(outfit.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

    </section>
  );
}
