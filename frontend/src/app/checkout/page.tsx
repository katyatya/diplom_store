"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { createOrder, fetchMe } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Оформление заказа</h1>
      {!authorized ? (
        <p className="text-sm text-muted-foreground">
          Оформление заказа доступно только после входа.{" "}
          <Link className="underline" href="/">
            Войти
          </Link>
        </p>
      ) : null}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Данные получателя</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ФИО"
              required
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
              required
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <Label className="grid gap-1">
              <span>Доставка</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as "PICKUP" | "CDEK")}
              >
                <option value="PICKUP">Самовывоз (0 руб)</option>
                <option value="CDEK">Доставка CDEK (370 руб)</option>
              </select>
            </Label>
            {deliveryType === "CDEK" ? (
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Адрес доставки"
                required
              />
            ) : null}
            <Label className="grid gap-1">
              <span>Оплата</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Онлайн">Онлайн</option>
                <option value="При получении">При получении</option>
              </select>
            </Label>
            <Button type="submit" disabled={!authorized}>
              Оформить заказ
            </Button>
          </form>
        </CardContent>
      </Card>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </section>
  );
}
