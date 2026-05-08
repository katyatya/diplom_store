"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { createOrder, fetchMe } from "@/lib/api";

export default function CheckoutPage() {
  const [authorized, setAuthorized] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "CDEK">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState("Онлайн");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchMe()
      .then(() => setAuthorized(true))
      .catch(() => setAuthorized(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const order = await createOrder({
        customerName,
        phone,
        email,
        address: deliveryType === "CDEK" ? address : undefined,
        deliveryType,
        paymentMethod,
      });
      setStatus(
        `Заказ ${order.id.slice(0, 8)} создан. Продавец увидит его в админке. Сумма: ${Number(order.totalAmount).toLocaleString("ru-RU")} руб.`,
      );
    } catch {
      setStatus("Не удалось оформить заказ. Убедитесь, что корзина не пустая и вы авторизованы.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Оформление заказа</h1>
      {!authorized ? (
        <p>
          Оформление заказа доступно только после входа. <Link href="/">Войти</Link>
        </p>
      ) : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="ФИО" required />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <label>
          Доставка:
          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value as "PICKUP" | "CDEK")}
          >
            <option value="PICKUP">Самовывоз (0 руб)</option>
            <option value="CDEK">Доставка CDEK (370 руб)</option>
          </select>
        </label>
        {deliveryType === "CDEK" ? (
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес доставки" required />
        ) : null}
        <label>
          Оплата:
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Онлайн">Онлайн</option>
            <option value="При получении">При получении</option>
          </select>
        </label>
        <button type="submit" disabled={!authorized}>
          Оформить заказ
        </button>
      </form>
      {status ? <p>{status}</p> : null}
    </section>
  );
}
