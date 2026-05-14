"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrder, fetchCart, fetchMe } from "@/lib/api";
import { requestAuthRequired } from "@/lib/auth-required";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/features/checkout/address-input";
import { getPrimaryProductImage } from "@/lib/product-images";
import { useToast } from "@/components/ui/toast";

type CheckoutErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: string;
};

const PHONE_MASK_REGEX = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authorized, setAuthorized] = useState(false);
  const [hasAccessFromCart, setHasAccessFromCart] = useState(false);
  const [cartItems, setCartItems] = useState<
    Awaited<ReturnType<typeof fetchCart>>["items"]
  >([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "CDEK">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState("Онлайн");
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [status, setStatus] = useState("");
  const { showToast } = useToast();

  const orderItemsTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const deliveryPrice = deliveryType === "CDEK" ? 370 : 0;
  const totalAmount = orderItemsTotal + deliveryPrice;

  useEffect(() => {
    const fromCart = searchParams.get("fromCart") === "1";
    setHasAccessFromCart(fromCart);
    if (!fromCart) {
      setStatus("Перейти к оформлению можно только из корзины.");
      router.replace("/cart");
      return;
    }

    void fetchMe()
      .then(async (user) => {
        setAuthorized(true);
        setProfileEmail(user.email);
        const cart = await fetchCart();
        setCartItems(cart.items);
        if (cart.items.length === 0) {
          setStatus("Корзина пуста. Добавьте товары перед оформлением заказа.");
          router.replace("/cart");
        }
      })
      .catch(() => {
        setAuthorized(false);
        requestAuthRequired(showToast, "checkout");
      });
  }, [router, searchParams, showToast]);

  function formatPhoneInput(rawValue: string): string {
    const digits = rawValue.replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";

    const normalized =
      digits[0] === "8" ? `7${digits.slice(1)}` : digits[0] === "7" ? digits : `7${digits}`;

    const limited = normalized.slice(0, 11);
    const country = limited[0];
    const part1 = limited.slice(1, 4);
    const part2 = limited.slice(4, 7);
    const part3 = limited.slice(7, 9);
    const part4 = limited.slice(9, 11);

    let result = `+${country}`;
    if (part1) result += ` (${part1}`;
    if (part1.length === 3) result += ")";
    if (part2) result += ` ${part2}`;
    if (part3) result += `-${part3}`;
    if (part4) result += `-${part4}`;

    return result;
  }

  function validateForm(): CheckoutErrors {
    const nextErrors: CheckoutErrors = {};
    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      nextErrors.customerName = "Укажите ФИО.";
    } else if (trimmedName.length < 2 || trimmedName.length > 80) {
      nextErrors.customerName = "ФИО должно быть от 2 до 80 символов.";
    } else if (!/^[A-Za-zА-Яа-яЁё\s'-]+$/u.test(trimmedName)) {
      nextErrors.customerName = "Используйте только буквы, пробел, дефис и апостроф.";
    }

    if (!trimmedPhone) {
      nextErrors.phone = "Укажите номер телефона.";
    } else if (!PHONE_MASK_REGEX.test(trimmedPhone)) {
      nextErrors.phone = "Телефон должен быть в формате +7 (999) 123-45-67.";
    }

    if (deliveryType === "CDEK") {
      if (!trimmedAddress) {
        nextErrors.address = "Укажите адрес доставки.";
      } else if (trimmedAddress.length < 10 || trimmedAddress.length > 200) {
        nextErrors.address = "Адрес должен быть от 10 до 200 символов.";
      }
    }

    if (!["Онлайн", "При получении"].includes(paymentMethod)) {
      nextErrors.paymentMethod = "Выберите корректный способ оплаты.";
    }

    return nextErrors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasAccessFromCart) {
      setStatus("Перейдите к оформлению из корзины.");
      router.push("/cart");
      return;
    }
    if (!authorized) {
      requestAuthRequired(showToast, "checkout");
      return;
    }
    if (cartItems.length === 0) {
      setStatus("Корзина пуста. Оформление заказа недоступно.");
      router.push("/cart");
      return;
    }
    if (!profileEmail) {
      setStatus("Не удалось получить email профиля. Пожалуйста, войдите снова.");
      requestAuthRequired(showToast, "checkout");
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatus("Проверьте корректность заполнения формы.");
      return;
    }

    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: profileEmail,
        address: deliveryType === "CDEK" ? address.trim() : undefined,
        deliveryType,
        paymentMethod,
      });
      setErrors({});
      setSuccessOrderId(order.id);
      setIsSuccessOpen(true);
      setStatus("");
      setCartItems([]);
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
          <CardTitle>Ваш заказ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Корзина пуста.</p>
          ) : null}
          {cartItems.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3 rounded-md border p-2"
            >
              <img
                src={getPrimaryProductImage(item.product)}
                alt={item.product.name}
                className="h-14 w-14 rounded-md object-cover"
              />
              <div className="grid gap-1">
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Цена: {Number(item.product.price).toLocaleString("ru-RU")} руб
                </p>
                <p className="text-xs text-muted-foreground">Размер: не указан</p>
                <p className="text-xs text-muted-foreground">Количество: {item.quantity}</p>
              </div>
            </article>
          ))}
          {cartItems.length > 0 ? (
            <div className="mt-1 grid gap-1 border-t pt-2 text-sm">
              <p className="text-muted-foreground">
                Товары: {orderItemsTotal.toLocaleString("ru-RU")} руб
              </p>
              <p className="text-muted-foreground">
                Доставка: {deliveryPrice.toLocaleString("ru-RU")} руб
              </p>
              <p className="font-semibold">Итого: {totalAmount.toLocaleString("ru-RU")} руб</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Данные получателя</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setErrors((current) => ({ ...current, customerName: undefined }));
              }}
              placeholder="ФИО"
              required
            />
            {errors.customerName ? (
              <p className="text-sm text-destructive">{errors.customerName}</p>
            ) : null}
            <Input
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneInput(e.target.value));
                setErrors((current) => ({ ...current, phone: undefined }));
              }}
              onBlur={() => {
                const trimmedPhone = phone.trim();
                if (!trimmedPhone || PHONE_MASK_REGEX.test(trimmedPhone)) {
                  setErrors((current) => ({ ...current, phone: undefined }));
                  return;
                }
                setErrors((current) => ({
                  ...current,
                  phone: "Неверно введен номер телефона",
                }));
              }}
              placeholder="+7 (999) 123-45-67"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            {errors.phone ? <p className="text-sm text-orange-500">{errors.phone}</p> : null}
            <div className="grid gap-1 rounded-md border bg-muted/30 p-2">
              <p className="text-xs text-muted-foreground">Email из профиля</p>
              <p className="text-sm">{profileEmail || "—"}</p>
            </div>
            <Label className="grid gap-1">
              <span>Доставка</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={deliveryType}
                onChange={(e) => {
                  const nextType = e.target.value as "PICKUP" | "CDEK";
                  setDeliveryType(nextType);
                  if (nextType === "PICKUP") {
                    setAddress("");
                  }
                  setErrors((current) => ({ ...current, address: undefined }));
                }}
              >
                <option value="PICKUP">Самовывоз (0 руб)</option>
                <option value="CDEK">Доставка CDEK (370 руб)</option>
              </select>
            </Label>
            {deliveryType === "CDEK" ? (
              <AddressInput
                value={address}
                onChange={(nextValue) => {
                  setAddress(nextValue);
                  setErrors((current) => ({ ...current, address: undefined }));
                }}
              />
            ) : null}
            {errors.address ? <p className="text-sm text-destructive">{errors.address}</p> : null}
            <Label className="grid gap-1">
              <span>Оплата</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setErrors((current) => ({ ...current, paymentMethod: undefined }));
                }}
              >
                <option value="Онлайн">Онлайн</option>
                <option value="При получении">При получении</option>
              </select>
            </Label>
            {errors.paymentMethod ? (
              <p className="text-sm text-destructive">{errors.paymentMethod}</p>
            ) : null}
            <Button type="submit">
              Оформить заказ
            </Button>
          </form>
        </CardContent>
      </Card>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              ✓
            </div>
            <DialogTitle className="text-center">Заказ успешно оформлен</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            Отслеживайте статус заказа на сайте.
          </p>
          <p className="text-center text-sm">
            Номер заказа: <strong>{successOrderId ?? "—"}</strong>
          </p>
          <Button asChild className="w-full">
            <Link href="/">Перейти на главную страницу</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
