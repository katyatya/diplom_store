"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Banner,
  Collection,
  Order,
  Product,
  adminCreateBanner,
  adminCreateCollection,
  adminCreateProduct,
  adminDeleteBanner,
  adminFetchBanners,
  adminFetchCollections,
  adminDeleteProduct,
  adminFetchOrders,
  adminFetchProducts,
  adminUpdateCollectionProducts,
  adminUpdateProduct,
  adminUpdateOrderStatus,
  fetchMe,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConstructorEditor } from "@/components/features/outfits/constructor-editor";

const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтвержден",
  ASSEMBLING: "Сборка",
  READY_FOR_PICKUP: "Готов к выдаче",
  SHIPPED: "Передан в доставку",
  DELIVERED: "Выдан",
  CANCELLED_NO_STOCK: "Отменен: нет в наличии",
  CANCELLED_BY_CLIENT: "Отменен клиентом",
  CANCELLED_OTHER: "Отменен (прочее)",
};

function getStatusBadgeClass(status: string): string {
  if (status === "DELIVERED" || status === "READY_FOR_PICKUP") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status.startsWith("CANCELLED")) {
    return "bg-red-100 text-red-700";
  }
  return "bg-amber-100 text-amber-700";
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message?.trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(parsed.message) && parsed.message.length > 0) {
      return parsed.message.join("; ");
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    return raw;
  }
  return raw || fallback;
}

function localizeAdminErrorMessage(message: string): string {
  const normalized = message.trim();
  const directMap: Record<string, string> = {
    "Collection not found": "Коллекция не найдена.",
    "Banner not found": "Баннер не найден.",
    "Product not found": "Товар не найден.",
    "Order not found": "Заказ не найден.",
    "Some products were not found": "Некоторые выбранные товары не найдены.",
    "Collection slug is invalid":
      "Slug коллекции должен содержать только латинские буквы, цифры и дефис.",
    "Collection title is required": "Введите название коллекции.",
    "Cancel reason is required for cancelled orders": "Укажите причину отмены заказа.",
  };
  if (directMap[normalized]) {
    return directMap[normalized];
  }
  return normalized;
}

export default function AdminPage() {
  const { showToast } = useToast();
  const [accessState, setAccessState] = useState<"checking" | "granted" | "denied">("checking");
  const [activeSection, setActiveSection] = useState<
    "products" | "orders" | "stylistLooks" | "banners" | "collections"
  >("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [cancelReasonDrafts, setCancelReasonDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [composition, setComposition] = useState("");
  const [category, setCategory] = useState("Одежда");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerCollectionId, setBannerCollectionId] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionSlug, setCollectionSlug] = useState("");
  const [collectionProductDrafts, setCollectionProductDrafts] = useState<Record<string, Set<string>>>(
    {},
  );
  const lastNewOrderEmailsRef = useRef<string[]>([]);
  const collectionDraftDirtyRef = useRef<Record<string, boolean>>({});
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [savingCollectionIds, setSavingCollectionIds] = useState<Record<string, boolean>>({});
  const [savingProductIds, setSavingProductIds] = useState<Record<string, boolean>>({});
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Record<string, boolean>>({});
  const [deletingProductIds, setDeletingProductIds] = useState<Record<string, boolean>>({});
  const [deletingBannerIds, setDeletingBannerIds] = useState<Record<string, boolean>>({});
  const loadErrorToastShownRef = useRef(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productDrafts, setProductDrafts] = useState<
    Record<
      string,
      {
        name: string;
        price: string;
        imageUrl: string;
        composition: string;
        category: string;
        isActive: boolean;
      }
    >
  >({});

  const newOrders = useMemo(
    () => orders.filter((order) => order.status === "NEW"),
    [orders],
  );
  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["CONFIRMED", "ASSEMBLING", "READY_FOR_PICKUP", "SHIPPED"].includes(order.status),
      ),
    [orders],
  );
  const archivedOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["DELIVERED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"].includes(
          order.status,
        ),
      ),
    [orders],
  );

  const load = useCallback(async () => {
    try {
      const [loadedProducts, loadedOrders, loadedBanners, loadedCollections] = await Promise.all([
        adminFetchProducts(),
        adminFetchOrders(),
        adminFetchBanners(),
        adminFetchCollections(),
      ]);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setBanners(loadedBanners);
      setCollections(loadedCollections);
      setCollectionProductDrafts((current) => {
        const next = { ...current };
        const collectionIds = new Set(loadedCollections.map((collection) => collection.id));
        for (const collectionId of Object.keys(next)) {
          if (!collectionIds.has(collectionId)) {
            delete next[collectionId];
            delete collectionDraftDirtyRef.current[collectionId];
          }
        }
        for (const collection of loadedCollections) {
          if (!collectionDraftDirtyRef.current[collection.id]) {
            next[collection.id] = new Set((collection.products ?? []).map((entry) => entry.productId));
          }
        }
        return next;
      });
      setProductDrafts((current) => {
        const next = { ...current };
        for (const product of loadedProducts) {
          if (!next[product.id]) {
            next[product.id] = {
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              composition: product.composition ?? "",
              category: product.category,
              isActive: product.isActive,
            };
          }
        }
        return next;
      });
      setStatusDrafts((current) => {
        const next = { ...current };
        for (const order of loadedOrders) {
          if (!next[order.id]) next[order.id] = order.status;
        }
        return next;
      });
      setCancelReasonDrafts((current) => {
        const next = { ...current };
        for (const order of loadedOrders) {
          if (!next[order.id]) next[order.id] = order.cancelReason ?? "";
        }
        return next;
      });
      const newOrderEmails = loadedOrders
        .filter((order) => order.status === "NEW")
        .map((order) => order.email);
      const previousUnique = new Set(lastNewOrderEmailsRef.current);
      const appearedEmails = newOrderEmails.filter((email) => !previousUnique.has(email));
      if (lastNewOrderEmailsRef.current.length > 0 && appearedEmails.length > 0) {
        const message = `Новые заказы от: ${appearedEmails.join(", ")}`;
        setStatus(message);
        showToast(message, "success");
      }
      lastNewOrderEmailsRef.current = newOrderEmails;
      loadErrorToastShownRef.current = false;
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось обновить данные админки. Проверьте доступ и сеть."),
      );
      setStatus(message);
      if (!loadErrorToastShownRef.current) {
        showToast(message, "error");
        loadErrorToastShownRef.current = true;
      }
    }
  }, [showToast]);

  async function onCreateBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingBanner) return;
    setIsCreatingBanner(true);
    try {
      await adminCreateBanner({
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim() || undefined,
        imageUrl: bannerImageUrl.trim(),
        collectionId: bannerCollectionId || undefined,
        isActive: true,
      });
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerImageUrl("");
      setBannerCollectionId("");
      setStatus("Баннер успешно добавлен.");
      showToast("Баннер успешно добавлен.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось создать баннер."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setIsCreatingBanner(false);
    }
  }

  async function onDeleteBanner(bannerId: string) {
    if (deletingBannerIds[bannerId]) return;
    const confirmed = window.confirm("Удалить баннер? Это действие нельзя отменить.");
    if (!confirmed) return;
    setDeletingBannerIds((current) => ({ ...current, [bannerId]: true }));
    try {
      await adminDeleteBanner(bannerId);
      setStatus("Баннер удален.");
      showToast("Баннер удален.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось удалить баннер."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setDeletingBannerIds((current) => ({ ...current, [bannerId]: false }));
    }
  }

  async function onCreateCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingCollection) return;
    setIsCreatingCollection(true);
    try {
      await adminCreateCollection({
        title: collectionTitle.trim(),
        slug: collectionSlug.trim() || undefined,
        isActive: true,
      });
      setCollectionTitle("");
      setCollectionSlug("");
      setStatus("Коллекция успешно создана.");
      showToast("Коллекция успешно создана.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось создать коллекцию."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setIsCreatingCollection(false);
    }
  }

  function onToggleProductInCollection(collectionId: string, productId: string, checked: boolean) {
    collectionDraftDirtyRef.current[collectionId] = true;
    setCollectionProductDrafts((current) => {
      const existing = current[collectionId] ?? new Set<string>();
      const nextSet = new Set(existing);
      if (checked) {
        nextSet.add(productId);
      } else {
        nextSet.delete(productId);
      }
      return {
        ...current,
        [collectionId]: nextSet,
      };
    });
  }

  async function onSaveCollectionProducts(collectionId: string) {
    if (savingCollectionIds[collectionId]) return;
    setSavingCollectionIds((current) => ({ ...current, [collectionId]: true }));
    try {
      const selectedProductIds = Array.from(collectionProductDrafts[collectionId] ?? []);
      await adminUpdateCollectionProducts(collectionId, selectedProductIds);
      collectionDraftDirtyRef.current[collectionId] = false;
      setStatus("Состав коллекции обновлен.");
      showToast("Состав коллекции обновлен.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось обновить товары коллекции."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setSavingCollectionIds((current) => ({ ...current, [collectionId]: false }));
    }
  }

  useEffect(() => {
    let intervalId: number | null = null;

    void (async () => {
      try {
        const me = await fetchMe();
        if (me.role !== "ADMIN") {
          setAccessState("denied");
          return;
        }
        setAccessState("granted");
        await load();
        intervalId = window.setInterval(() => {
          void load();
        }, 15000);
      } catch {
        setAccessState("denied");
      }
    })();

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [load]);

  function getAllowedNextStatuses(currentStatus: string, deliveryType: string): string[] {
    const map: Record<string, string[]> = {
      NEW: ["CONFIRMED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
      CONFIRMED: ["ASSEMBLING", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
      ASSEMBLING:
        deliveryType === "PICKUP"
          ? ["READY_FOR_PICKUP", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"]
          : ["SHIPPED", "CANCELLED_NO_STOCK", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
      READY_FOR_PICKUP: ["DELIVERED", "CANCELLED_BY_CLIENT", "CANCELLED_OTHER"],
      SHIPPED: ["DELIVERED", "CANCELLED_OTHER"],
      DELIVERED: [],
      CANCELLED_NO_STOCK: [],
      CANCELLED_BY_CLIENT: [],
      CANCELLED_OTHER: [],
    };
    return [currentStatus, ...(map[currentStatus] ?? [])];
  }

  async function onUpdateOrderStatus(order: Order) {
    if (updatingOrderIds[order.id]) return;
    const nextStatus = statusDrafts[order.id] ?? order.status;
    const cancelReason = cancelReasonDrafts[order.id]?.trim() ?? "";
    if (nextStatus.startsWith("CANCELLED") && !cancelReason) {
      setStatus("Для отмены заказа укажите причину.");
      return;
    }
    setUpdatingOrderIds((current) => ({ ...current, [order.id]: true }));
    try {
      await adminUpdateOrderStatus(order.id, {
        status: nextStatus,
        cancelReason: nextStatus.startsWith("CANCELLED") ? cancelReason : undefined,
      });
      setStatus("Статус заказа обновлен.");
      showToast("Статус заказа обновлен.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось обновить статус заказа."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setUpdatingOrderIds((current) => ({ ...current, [order.id]: false }));
    }
  }

  async function onCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingProduct) return;
    setIsCreatingProduct(true);
    try {
      await adminCreateProduct({
        name: name.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim(),
        composition: composition.trim() || undefined,
        category: category.trim(),
      });
      setName("");
      setPrice("0");
      setImageUrl("");
      setComposition("");
      setStatus("Товар успешно добавлен.");
      showToast("Товар успешно добавлен.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось создать товар."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setIsCreatingProduct(false);
    }
  }

  async function onDeleteProduct(productId: string) {
    if (deletingProductIds[productId]) return;
    const confirmed = window.confirm("Удалить товар? Он будет деактивирован.");
    if (!confirmed) return;
    setDeletingProductIds((current) => ({ ...current, [productId]: true }));
    try {
      await adminDeleteProduct(productId);
      setStatus("Товар деактивирован.");
      showToast("Товар деактивирован.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось удалить товар."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setDeletingProductIds((current) => ({ ...current, [productId]: false }));
    }
  }

  async function onSaveProduct(productId: string) {
    if (savingProductIds[productId]) return;
    const draft = productDrafts[productId];
    if (!draft) return;
    setSavingProductIds((current) => ({ ...current, [productId]: true }));
    try {
      await adminUpdateProduct(productId, {
        name: draft.name.trim(),
        price: Number(draft.price),
        imageUrl: draft.imageUrl.trim(),
        composition: draft.composition.trim() || undefined,
        category: draft.category.trim(),
        isActive: draft.isActive,
      });
      setEditingProductId(null);
      setStatus("Товар обновлен.");
      showToast("Товар обновлен.", "success");
      await load();
    } catch (error) {
      const message = localizeAdminErrorMessage(
        extractApiErrorMessage(error, "Не удалось обновить товар."),
      );
      setStatus(message);
      showToast(message, "error");
    } finally {
      setSavingProductIds((current) => ({ ...current, [productId]: false }));
    }
  }

  function renderOrderCard(order: Order) {
    return (
      <article key={order.id} className="rounded-lg border p-3">
        <strong>Заказ {order.id}</strong> - {order.customerName}
        <p className="my-1 text-sm text-muted-foreground">
          {order.email} / {order.phone}
        </p>
        <p className="my-1 text-sm text-muted-foreground">
          {order.deliveryType} / {Number(order.totalAmount).toLocaleString("ru-RU")} руб
        </p>
        <div className="my-2">
          <p className="mb-1 text-sm font-medium">Товары в заказе:</p>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.productName} ({item.sizeLabel === "ONE_SIZE" ? "ONE SIZE" : item.sizeLabel}) x{" "}
                {item.quantity} - {Number(item.productPrice).toLocaleString("ru-RU")} руб
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 grid max-w-md gap-2">
          <p className="text-sm text-muted-foreground">
            Текущий статус:{" "}
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
            >
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
          </p>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={statusDrafts[order.id] ?? order.status}
            onChange={(event) =>
              setStatusDrafts((current) => ({
                ...current,
                [order.id]: event.target.value,
              }))
            }
          >
            {getAllowedNextStatuses(order.status, order.deliveryType).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {ORDER_STATUS_LABELS[statusOption] ?? statusOption}
              </option>
            ))}
          </select>
          {(statusDrafts[order.id] ?? order.status).startsWith("CANCELLED") ? (
            <Input
              value={cancelReasonDrafts[order.id] ?? ""}
              onChange={(event) =>
                setCancelReasonDrafts((current) => ({
                  ...current,
                  [order.id]: event.target.value,
                }))
              }
              placeholder="Причина отмены"
            />
          ) : null}
          {order.cancelReason ? (
            <p className="text-sm text-muted-foreground">Причина отмены: {order.cancelReason}</p>
          ) : null}
          <Button
            size="sm"
            disabled={updatingOrderIds[order.id]}
            onClick={() => void onUpdateOrderStatus(order)}
          >
            Обновить статус
          </Button>
        </div>
      </article>
    );
  }

  if (accessState === "checking") {
    return (
      <section className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Админка</h1>
        <p className="text-sm text-muted-foreground">Проверяем доступ...</p>
      </section>
    );
  }

  if (accessState === "denied") {
    return (
      <section className="grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Доступ запрещен</h1>
        <p className="text-sm text-muted-foreground">
          Эта страница доступна только администраторам.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Админка</h1>
     
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <div className="grid gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => setActiveSection("products")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === "products" ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">Товары</p>
          <p className="text-sm text-muted-foreground">
            Добавление, редактирование и удаление существующих товаров
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("orders")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === "orders" ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">Заказы</p>
          <p className="text-sm text-muted-foreground">
            Новые, в работе и архивные заказы + смена статуса
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("stylistLooks")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === "stylistLooks" ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">Образы стилиста</p>
          <p className="text-sm text-muted-foreground">
            Конструктор и управление образами, которые публикуются как стилистские
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("collections")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === "collections" ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">Коллекции</p>
          <p className="text-sm text-muted-foreground">
            Создание коллекций для разделов и ссылок с главной страницы
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("banners")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === "banners" ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">Баннеры</p>
          <p className="text-sm text-muted-foreground">
            Добавление баннеров, отображаемых на главной странице
          </p>
        </button>
      </div>

      {activeSection === "products" ? (
        <>
      <Card>
        <CardHeader>
          <CardTitle>Добавить товар</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateProduct} className="grid max-w-md gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название"
              required
            />
            <Input
            value={price}
            type="number"
            min={0}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цена"
            required
            />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL фото (несколько через запятую)"
              required
            />
            <Input
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
              placeholder="Состав (например: 80% хлопок, 20% полиэстер)"
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Категория"
              required
            />
            <Button type="submit" disabled={isCreatingProduct}>
              Добавить
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {products.map((product) => (
            <article key={product.id} className="rounded-lg border p-3">
              {editingProductId === product.id ? (
                <div className="grid gap-2">
                  <Input
                    value={productDrafts[product.id]?.name ?? ""}
                    onChange={(event) =>
                      setProductDrafts((current) => ({
                        ...current,
                        [product.id]: {
                          ...current[product.id],
                          name: event.target.value,
                        },
                      }))
                    }
                    placeholder="Название"
                  />
                  <Input
                    value={productDrafts[product.id]?.price ?? ""}
                    type="number"
                    min={0}
                    onChange={(event) =>
                      setProductDrafts((current) => ({
                        ...current,
                        [product.id]: {
                          ...current[product.id],
                          price: event.target.value,
                        },
                      }))
                    }
                    placeholder="Цена"
                  />
                  <Input
                    value={productDrafts[product.id]?.imageUrl ?? ""}
                    onChange={(event) =>
                      setProductDrafts((current) => ({
                        ...current,
                        [product.id]: {
                          ...current[product.id],
                          imageUrl: event.target.value,
                        },
                      }))
                    }
                    placeholder="URL фото"
                  />
                  <Input
                    value={productDrafts[product.id]?.composition ?? ""}
                    onChange={(event) =>
                      setProductDrafts((current) => ({
                        ...current,
                        [product.id]: {
                          ...current[product.id],
                          composition: event.target.value,
                        },
                      }))
                    }
                    placeholder="Состав"
                  />
                  <Input
                    value={productDrafts[product.id]?.category ?? ""}
                    onChange={(event) =>
                      setProductDrafts((current) => ({
                        ...current,
                        [product.id]: {
                          ...current[product.id],
                          category: event.target.value,
                        },
                      }))
                    }
                    placeholder="Категория"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={productDrafts[product.id]?.isActive ?? product.isActive}
                      onChange={(event) =>
                        setProductDrafts((current) => ({
                          ...current,
                          [product.id]: {
                            ...current[product.id],
                            isActive: event.target.checked,
                          },
                        }))
                      }
                    />
                    Активен
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={savingProductIds[product.id]}
                      onClick={() => void onSaveProduct(product.id)}
                    >
                      Сохранить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingProductId(null)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <strong>{product.name}</strong> - {Number(product.price).toLocaleString("ru-RU")} руб
                  <p className="my-1 text-sm text-muted-foreground">
                    {product.category} / {product.isActive ? "Активен" : "Скрыт"}
                  </p>
                  <p className="my-1 text-sm text-muted-foreground">
                    Состав: {product.composition || "Не указан"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingProductId(product.id)}>
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deletingProductIds[product.id]}
                      onClick={() => void onDeleteProduct(product.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))}
        </CardContent>
      </Card>
        </>
      ) : null}

      {activeSection === "orders" ? (
        <>
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle>Новые заказы (приоритет)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Сначала обработайте эти заказы. Новые заказы отображаются здесь сразу после оформления.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {newOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Новых заказов нет.</p>
          ) : (
            newOrders.map(renderOrderCard)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заказы в работе</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Заказов в работе нет.</p>
          ) : (
            activeOrders.map(renderOrderCard)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Архив заказов</CardTitle>
          <p className="text-sm text-muted-foreground">
            Выданные и отмененные заказы перемещаются сюда автоматически.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {archivedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Архив пока пуст.</p>
          ) : (
            archivedOrders.map(renderOrderCard)
          )}
        </CardContent>
      </Card>
        </>
      ) : null}
      {activeSection === "stylistLooks" ? <ConstructorEditor mode="adminStylist" /> : null}
      {activeSection === "collections" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Добавить коллекцию</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateCollection} className="grid max-w-md gap-2">
                <Input
                  value={collectionTitle}
                  onChange={(event) => setCollectionTitle(event.target.value)}
                  placeholder="Название коллекции"
                  required
                />
                <Input
                  value={collectionSlug}
                  onChange={(event) => setCollectionSlug(event.target.value)}
                  placeholder="Slug (необязательно, например summer-2026)"
                />
                <Button type="submit" disabled={isCreatingCollection}>
                  Создать коллекцию
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Существующие коллекции</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Коллекции пока не добавлены.</p>
              ) : (
                collections.map((collection) => (
                  <article key={collection.id} className="rounded-lg border p-3">
                    <strong>{collection.title}</strong>
                    <p className="my-1 text-sm text-muted-foreground">
                      slug: {collection.slug} / {collection.isActive ? "Активна" : "Скрыта"}
                    </p>
                    <p className="my-1 text-sm text-muted-foreground">
                      Товаров в коллекции: {(collection.products ?? []).length}
                    </p>
                    <div className="mt-3 grid gap-2 rounded-md border p-3">
                      <p className="text-sm font-medium">Товары в коллекции</p>
                      <div className="grid max-h-56 gap-2 overflow-auto">
                        {products
                          .filter((product) => product.isActive)
                          .map((product) => {
                            const selected = collectionProductDrafts[collection.id]?.has(product.id) ?? false;
                            return (
                              <label key={product.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(event) =>
                                    onToggleProductInCollection(
                                      collection.id,
                                      product.id,
                                      event.target.checked,
                                    )
                                  }
                                />
                                <span>
                                  {product.name} ({Number(product.price).toLocaleString("ru-RU")} руб)
                                </span>
                              </label>
                            );
                          })}
                      </div>
                      <Button
                        size="sm"
                        disabled={savingCollectionIds[collection.id]}
                        onClick={() => void onSaveCollectionProducts(collection.id)}
                      >
                        Сохранить товары коллекции
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
      {activeSection === "banners" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Добавить баннер</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateBanner} className="grid max-w-md gap-2">
                <Input
                  value={bannerTitle}
                  onChange={(event) => setBannerTitle(event.target.value)}
                  placeholder="Заголовок баннера"
                  required
                />
                <Input
                  value={bannerSubtitle}
                  onChange={(event) => setBannerSubtitle(event.target.value)}
                  placeholder="Подзаголовок (необязательно)"
                />
                <Input
                  value={bannerImageUrl}
                  onChange={(event) => setBannerImageUrl(event.target.value)}
                  placeholder="URL изображения"
                  required
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={bannerCollectionId}
                  onChange={(event) => setBannerCollectionId(event.target.value)}
                >
                  <option value="">Без коллекции</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title} ({collection.slug})
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={isCreatingBanner}>
                  Создать баннер
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Существующие баннеры</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {banners.length === 0 ? (
                <p className="text-sm text-muted-foreground">Баннеры пока не добавлены.</p>
              ) : (
                banners.map((banner) => (
                  <article key={banner.id} className="rounded-lg border p-3">
                    <strong>{banner.title}</strong>
                    <p className="my-1 text-sm text-muted-foreground">
                      section: {banner.section} / {banner.isActive ? "Активен" : "Скрыт"}
                    </p>
                    <p className="my-1 text-sm text-muted-foreground">
                      Коллекция: {banner.collection?.title ?? "Не выбрана"}
                    </p>
                    <a
                      href={banner.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Открыть изображение
                    </a>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingBannerIds[banner.id]}
                        onClick={() => void onDeleteBanner(banner.id)}
                      >
                        Удалить баннер
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}
