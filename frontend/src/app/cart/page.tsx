"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Cart,
  GuestCartItem,
  fetchCart,
  getGuestCartItems,
  removeCartItem,
  removeGuestCartItem,
  updateCartItem,
  updateGuestCartItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DisplayCartItem = {
  id: string;
  quantity: number;
  productId: string;
  product: GuestCartItem["product"];
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      setCart(await fetchCart());
      setAuthorized(true);
      return;
    } catch {
      setAuthorized(false);
    }
    setGuestItems(getGuestCartItems());
  }

  useEffect(() => {
    void load();
  }, []);

  const items = useMemo<DisplayCartItem[]>(() => {
    if (authorized) {
      return (cart?.items ?? []).map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      }));
    }
    return guestItems.map((item) => ({
      id: item.productId,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    }));
  }, [authorized, cart?.items, guestItems]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    [items],
  );

  async function onChangeQty(itemId: string, nextQty: number, productId: string) {
    if (nextQty < 1) return;
    if (authorized) {
      try {
        const updated = await updateCartItem(itemId, nextQty);
        setCart(updated);
      } catch {
        setStatus("Не удалось изменить количество.");
      }
      return;
    }

    setGuestItems(updateGuestCartItem(productId, nextQty));
  }

  async function onRemove(itemId: string, productId: string) {
    if (authorized) {
      try {
        const updated = await removeCartItem(itemId);
        setCart(updated);
      } catch {
        setStatus("Не удалось удалить товар из корзины.");
      }
      return;
    }
    setGuestItems(removeGuestCartItem(productId));
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Корзина</h1>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {!authorized ? (
        <p className="text-sm text-muted-foreground">
          Вы в режиме гостя. После входа гостевая корзина будет перенесена в аккаунт.
        </p>
      ) : null}
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Корзина пуста.</p> : null}
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="grid gap-3 p-4">
            <h3 className="font-medium">{item.product.name}</h3>
            <p className="text-sm text-muted-foreground">
              {Number(item.product.price).toLocaleString("ru-RU")} руб
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onChangeQty(item.id, item.quantity - 1, item.productId)}
              >
              -
              </Button>
              <span className="text-sm">Количество: {item.quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onChangeQty(item.id, item.quantity + 1, item.productId)}
              >
              +
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onRemove(item.id, item.productId)}
              >
                Удалить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <p>
        <strong>Итого: {total.toLocaleString("ru-RU")} руб</strong>
      </p>
      <Button asChild className="w-fit">
        <Link href={authorized ? "/checkout" : "/"}>
          {authorized ? "Перейти к оформлению" : "Войти для оформления заказа"}
        </Link>
      </Button>
    </section>
  );
}
