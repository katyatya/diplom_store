"use client";

import { useEffect, useState } from "react";
import { AuthUser, Order, fetchMe, fetchMyOrders } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => setUser(null));
    void fetchMyOrders()
      .then(setOrders)
      .catch(() => setStatus("Войдите в аккаунт, чтобы посмотреть историю заказов."));
  }, []);

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Личный профиль</h1>
      {user ? (
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
            <h3 className="font-medium">Заказ {order.id.slice(0, 8)}</h3>
            <p className="text-sm text-muted-foreground">Статус: {order.status}</p>
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
