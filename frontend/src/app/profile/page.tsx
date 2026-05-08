"use client";

import { useEffect, useState } from "react";
import { Order, fetchMyOrders } from "@/lib/api";

export default function ProfilePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchMyOrders()
      .then(setOrders)
      .catch(() => setStatus("Войдите в аккаунт, чтобы посмотреть историю заказов."));
  }, []);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Личный профиль</h1>
      <h2>Мои заказы</h2>
      {status ? <p>{status}</p> : null}
      {orders.length === 0 ? <p>Заказов пока нет.</p> : null}
      {orders.map((order) => (
        <article key={order.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <h3>Заказ {order.id.slice(0, 8)}</h3>
          <p>Статус: {order.status}</p>
          <p>
            Доставка: {order.deliveryType === "PICKUP" ? "Самовывоз" : "CDEK"} /{" "}
            {Number(order.deliveryPrice).toLocaleString("ru-RU")} руб
          </p>
          <p>Оплата: {order.paymentMethod}</p>
          <p>
            Сумма: <strong>{Number(order.totalAmount).toLocaleString("ru-RU")} руб</strong>
          </p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.productName} x {item.quantity}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
