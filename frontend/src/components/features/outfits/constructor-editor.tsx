"use client";

import {
  type DragEvent as ReactDragEvent,
  useEffect,
  useMemo,
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
import { OutfitCanvas } from "@/components/features/outfits/outfit-canvas";
import type { CanvasOutfitItem } from "@/components/features/outfits/outfit-canvas";
import { ConstructorProductCatalog } from "@/components/features/outfits/constructor-product-catalog";
import { ConstructorSettingsPanel } from "@/components/features/outfits/constructor-settings-panel";
import { SavedOutfitsGrid } from "@/components/features/outfits/saved-outfits-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const CANVAS_WIDTH = 430;
const CANVAS_HEIGHT = 620;
const DEFAULT_ITEM_WIDTH = 160;
const DEFAULT_ITEM_HEIGHT = 220;

type OutfitPlacement = Outfit["items"][number];

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

function createCanvasItemNode(productId: string, index: number, x: number, y: number): CanvasOutfitItem {
  return {
    nodeId: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    x,
    y,
    zIndex: index + 1,
    width: DEFAULT_ITEM_WIDTH,
    height: DEFAULT_ITEM_HEIGHT,
    rotation: 0,
  };
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
  const [handledInitialProductId, setHandledInitialProductId] = useState<string | null>(null);

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
    if (handledInitialProductId === initialProductId) return;
    const targetProduct = productsById[initialProductId];
    if (!targetProduct) return;
    addProductToCanvas(targetProduct);
    setHandledInitialProductId(initialProductId);
  }, [handledInitialProductId, initialProductId, products.length, productsById]);

  function addProductToCanvas(product: Product) {
    setCanvasItems((current) => [
      ...current,
      createCanvasItemNode(
        product.id,
        current.length,
        120 + (current.length % 3) * 16,
        50 + (current.length % 3) * 22,
      ),
    ]);
  }

  function addProductToCanvasAtPosition(product: Product, x: number, y: number) {
    const boundedX = Math.max(0, Math.min(x, CANVAS_WIDTH - DEFAULT_ITEM_WIDTH));
    const boundedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT));
    setCanvasItems((current) => [
      ...current,
      createCanvasItemNode(product.id, current.length, boundedX, boundedY),
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
          <ConstructorProductCatalog
            categories={categories}
            selectedCategory={selectedCategory}
            visibleProducts={visibleProducts}
            onSelectCategory={setSelectedCategory}
            onAddProduct={addProductToCanvas}
            onProductDragStart={onProductDragStart}
          />

          <div
            className="relative mx-auto overflow-hidden border bg-[#fafafa] xl:mx-0"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={onCanvasDrop}
          >
            {canvasItems.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50">
                  Перетащите товары сюда
                </p>
              </div>
            ) : null}
            <OutfitCanvas
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              productsById={productsById}
              items={canvasItems}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              onChangeItem={updateCanvasItem}
              onRemoveItem={removeItemFromCanvas}
            />
          </div>

          <ConstructorSettingsPanel
            selectedRotation={selectedItem ? selectedItem.rotation : null}
            hasSelection={Boolean(selectedItem)}
            onRotationChange={(nextRotation) => {
              if (!selectedItem) return;
              updateCanvasItem(selectedItem.nodeId, { rotation: nextRotation });
            }}
            onBringForward={bringSelectedForward}
            onSendBackward={sendSelectedBackward}
            onRemoveSelected={removeSelectedItem}
          />
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

      <SavedOutfitsGrid
        mode={mode}
        outfits={myOutfits}
        productsById={productsById}
        pendingCartOutfitId={pendingCartOutfitId}
        onEditOutfit={loadOutfitToCanvas}
        onDeleteOutfit={(outfitId) => void onDeleteOutfit(outfitId)}
        onAddToCart={(outfitId) => void onAddOutfitToCart(outfitId)}
      />

    </section>
  );
}
