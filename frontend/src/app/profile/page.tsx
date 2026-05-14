"use client";

import { useEffect, useState } from "react";
import { AuthUser, Order, fetchMe, fetchMyOrders } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

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

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [loadedUser, loadedOrders] = await Promise.all([fetchMe(), fetchMyOrders()]);
        setUser(loadedUser);
        setOrders(loadedOrders);
        setStatus("");
      } catch {
        setUser(null);
        setOrders([]);
        setStatus("Не удалось загрузить профиль. Выполните вход.");
      } finally {
        setIsUserLoading(false);
      }
    })();
  }, []);

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Личный профиль</h1>
      {isUserLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Загрузка данных профиля...
        </div>
      ) : user ? (
        <p className="text-sm text-muted-foreground">
          {user.name || "Пользователь"} ({user.email})
        </p>
      ) : null}
      <h2 className="text-xl font-semibold">Мои заказы</h2>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {orders.length === 0 ? <p className="text-sm text-muted-foreground">Заказов пока нет.</p> : null}
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="grid gap-1 p-4">
            <h3 className="font-medium">Заказ {order.id}</h3>
            <p className="text-sm text-muted-foreground">
              Статус:{" "}
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </p>
            {order.cancelReason ? (
              <p className="text-sm text-muted-foreground">Причина отмены: {order.cancelReason}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">
            Доставка: {order.deliveryType === "PICKUP" ? "Самовывоз" : "CDEK"} /{" "}
            {Number(order.deliveryPrice).toLocaleString("ru-RU")} руб
            </p>
            <p className="text-sm text-muted-foreground">Оплата: {order.paymentMethod}</p>
            <p>
              Сумма: <strong>{Number(order.totalAmount).toLocaleString("ru-RU")} руб</strong>
            </p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} x {item.quantity}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
