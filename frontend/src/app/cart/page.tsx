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
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Корзина</h1>
      {status ? <p>{status}</p> : null}
      {!authorized ? (
        <p>
          Вы в режиме гостя. После входа гостевая корзина будет перенесена в аккаунт.
        </p>
      ) : null}
      {items.length === 0 ? <p>Корзина пуста.</p> : null}
      {items.map((item) => (
        <article key={item.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <h3>{item.product.name}</h3>
          <p>{Number(item.product.price).toLocaleString("ru-RU")} руб</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => void onChangeQty(item.id, item.quantity - 1, item.productId)}>
              -
            </button>
            <span>Количество: {item.quantity}</span>
            <button onClick={() => void onChangeQty(item.id, item.quantity + 1, item.productId)}>
              +
            </button>
            <button onClick={() => void onRemove(item.id, item.productId)}>Удалить</button>
          </div>
        </article>
      ))}
      <p>
        <strong>Итого: {total.toLocaleString("ru-RU")} руб</strong>
      </p>
      <Link href={authorized ? "/checkout" : "/"}>{authorized ? "Перейти к оформлению" : "Войти для оформления заказа"}</Link>
    </section>
  );
}
