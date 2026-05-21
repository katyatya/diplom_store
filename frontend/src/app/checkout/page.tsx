"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrder, fetchCart, fetchMe } from "@/lib/api";
import { requestAuthRequired } from "@/lib/auth-required";
import { Button } from "@/components/ui/button";
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
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка...</p>}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
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
    (sum, item) => sum + Number(item.variant.product.price) * item.quantity,
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
    <section className="grid gap-8">
      <div className="border-b pb-6">
        <Link
          href="/cart"
          className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Корзина
        </Link>
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Оформление заказа
        </h1>
      </div>

      {!authorized ? (
        <p className="text-sm text-muted-foreground">
          Оформление заказа доступно только после{" "}
          <Link className="underline underline-offset-2" href="/">
            входа в аккаунт
          </Link>
          .
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Form */}
        <div>
          <form id="checkout-form" onSubmit={(e) => void onSubmit(e)} className="grid gap-6">
            <fieldset className="grid gap-4">
              <legend className="mb-2 text-xs uppercase tracking-[0.2em]">Данные получателя</legend>
              <div className="grid gap-1">
                <Input
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setErrors((current) => ({ ...current, customerName: undefined }));
                  }}
                  placeholder="ФИО"
                  required
                  className="h-11"
                />
                {errors.customerName ? (
                  <p className="text-xs text-destructive">{errors.customerName}</p>
                ) : null}
              </div>
              <div className="grid gap-1">
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
                  className="h-11"
                />
                {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
              </div>
              <div className="grid gap-1 bg-muted/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Email из профиля</p>
                <p className="text-sm">{profileEmail || "—"}</p>
              </div>
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-2 text-xs uppercase tracking-[0.2em]">Доставка</legend>
              <Label className="grid gap-2">
                <span className="text-xs text-muted-foreground">Способ доставки</span>
                <select
                  className="h-11 border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                  <option value="PICKUP">Самовывоз — бесплатно</option>
                  <option value="CDEK">Доставка CDEK — 370 ₽</option>
                </select>
              </Label>
              {deliveryType === "CDEK" ? (
                <div className="grid gap-1">
                  <AddressInput
                    value={address}
                    onChange={(nextValue) => {
                      setAddress(nextValue);
                      setErrors((current) => ({ ...current, address: undefined }));
                    }}
                  />
                  {errors.address ? (
                    <p className="text-xs text-destructive">{errors.address}</p>
                  ) : null}
                </div>
              ) : null}
            </fieldset>

            <fieldset className="grid gap-4">
              <legend className="mb-2 text-xs uppercase tracking-[0.2em]">Оплата</legend>
              <Label className="grid gap-2">
                <span className="text-xs text-muted-foreground">Способ оплаты</span>
                <select
                  className="h-11 border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                <p className="text-xs text-destructive">{errors.paymentMethod}</p>
              ) : null}
            </fieldset>

          </form>
        </div>

        {/* Order summary */}
        <div className="border p-6">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em]">Ваш заказ</h2>
          <div className="grid gap-4">
            {cartItems.map((item) => (
              <div key={item.id} className="grid grid-cols-[60px_1fr] gap-3">
                <img
                  src={getPrimaryProductImage(item.variant.product)}
                  alt={item.variant.product.name}
                  className="h-20 w-full object-cover"
                />
                <div className="grid content-start gap-1">
                  <p className="text-xs uppercase tracking-wide leading-snug">
                    {item.variant.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.variant.sizeLabel === "ONE_SIZE" ? "ONE SIZE" : item.variant.sizeLabel}
                    {" · "}× {item.quantity}
                  </p>
                  <p className="text-sm font-light">
                    {(Number(item.variant.product.price) * item.quantity).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>
            ))}
          </div>

          {cartItems.length > 0 ? (
            <div className="mt-6 grid gap-2 border-t pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Товары</span>
                <span>{orderItemsTotal.toLocaleString("ru-RU")} ₽</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Доставка</span>
                <span>{deliveryPrice === 0 ? "Бесплатно" : `${deliveryPrice.toLocaleString("ru-RU")} ₽`}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium uppercase tracking-wide">Итого</span>
                <span className="text-lg font-light">{totalAmount.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-t pt-6">
        {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        <Button
          type="submit"
          form="checkout-form"
          className="h-12 w-full text-xs uppercase tracking-[0.2em]"
        >
          Подтвердить заказ
        </Button>
      </div>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-foreground text-xl">
              ✓
            </div>
            <DialogTitle
              className="text-center text-2xl font-light italic"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Заказ оформлен
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            Отслеживайте статус заказа в личном кабинете
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            № <span className="font-medium text-foreground">{successOrderId ?? "—"}</span>
          </p>
          <div className="mt-4 grid gap-2">
            <Button asChild className="h-11 w-full text-xs uppercase tracking-[0.15em]">
              <Link href="/profile">Перейти в профиль</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full text-xs uppercase tracking-[0.15em]">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
