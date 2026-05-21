"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Order,
  Product,
  adminCreateProduct,
  adminDeleteProduct,
  adminFetchOrders,
  adminFetchProducts,
  adminUpdateProduct,
  adminUpdateOrderStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<"products" | "orders" | "stylistLooks">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastNewOrderEmails, setLastNewOrderEmails] = useState<string[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [cancelReasonDrafts, setCancelReasonDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [composition, setComposition] = useState("");
  const [category, setCategory] = useState("Одежда");
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

  async function load() {
    try {
      const [loadedProducts, loadedOrders] = await Promise.all([
        adminFetchProducts(),
        adminFetchOrders(),
      ]);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
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
      const previousUnique = new Set(lastNewOrderEmails);
      const appearedEmails = newOrderEmails.filter((email) => !previousUnique.has(email));
      if (lastNewOrderEmails.length > 0 && appearedEmails.length > 0) {
        setStatus(`Новые заказы от: ${appearedEmails.join(", ")}`);
      }
      setLastNewOrderEmails(newOrderEmails);
    } catch {
      setStatus("Доступ запрещен. Войдите под admin@fashionstore.local / Admin123!");
    }
  }

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [lastNewOrderEmails.length]);

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
    const nextStatus = statusDrafts[order.id] ?? order.status;
    const cancelReason = cancelReasonDrafts[order.id]?.trim() ?? "";
    if (nextStatus.startsWith("CANCELLED") && !cancelReason) {
      setStatus("Для отмены заказа укажите причину.");
      return;
    }
    try {
      await adminUpdateOrderStatus(order.id, {
        status: nextStatus,
        cancelReason: nextStatus.startsWith("CANCELLED") ? cancelReason : undefined,
      });
      setStatus("Статус заказа обновлен.");
      await load();
    } catch {
      setStatus("Не удалось обновить статус заказа.");
    }
  }

  async function onCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setStatus("Товар добавлен.");
      await load();
    } catch {
      setStatus("Не удалось создать товар.");
    }
  }

  async function onDeleteProduct(productId: string) {
    try {
      await adminDeleteProduct(productId);
      setStatus("Товар деактивирован.");
      await load();
    } catch {
      setStatus("Не удалось удалить товар.");
    }
  }

  async function onSaveProduct(productId: string) {
    const draft = productDrafts[productId];
    if (!draft) return;
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
      await load();
    } catch {
      setStatus("Не удалось обновить товар.");
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
          <Button size="sm" onClick={() => void onUpdateOrderStatus(order)}>
            Обновить статус
          </Button>
        </div>
      </article>
    );
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Админка</h1>
     
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
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
            <Button type="submit">Добавить</Button>
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
                    <Button size="sm" onClick={() => void onSaveProduct(product.id)}>
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
                    <Button size="sm" variant="outline" onClick={() => void onDeleteProduct(product.id)}>
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
    </section>
  );
}
