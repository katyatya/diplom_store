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
import { AUTH_STATE_CHANGED_EVENT, requestAuthRequired } from "@/lib/auth-required";
import { Button } from "@/components/ui/button";
import { getPrimaryProductImage } from "@/lib/product-images";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatSizeLabel } from "@/lib/format";
import { getProductHref } from "@/lib/catalog";

type DisplayCartItem = {
  id: string;
  quantity: number;
  variantId: string;
  sizeLabel: string;
  product: GuestCartItem["product"];
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingQtyItemId, setPendingQtyItemId] = useState<string | null>(null);
  const [pendingRemoveItemId, setPendingRemoveItemId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const { showToast } = useToast();

  async function load() {
    setIsLoading(true);
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
    void load().finally(() => setIsLoading(false));

    function onAuthChanged() {
      void load().finally(() => setIsLoading(false));
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, onAuthChanged);
    };
  }, []);

  const items = useMemo<DisplayCartItem[]>(() => {
    if (authorized) {
      return (cart?.items ?? []).map((item) => ({
        id: item.id,
        variantId: item.variantId,
        sizeLabel: item.variant.sizeLabel,
        quantity: item.quantity,
        product: item.variant.product,
      }));
    }
    return guestItems.map((item) => ({
      id: item.variantId,
      variantId: item.variantId,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
      product: item.product,
    }));
  }, [authorized, cart?.items, guestItems]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    [items],
  );

  async function onChangeQty(itemId: string, nextQty: number, variantId: string) {
    if (nextQty < 1 || pendingQtyItemId === itemId || pendingRemoveItemId === itemId) return;
    setPendingQtyItemId(itemId);
    try {
      if (authorized) {
        const updated = await updateCartItem(itemId, nextQty);
        setCart(updated);
        return;
      }
      setGuestItems(updateGuestCartItem(variantId, nextQty));
    } catch {
      setStatus("Не удалось изменить количество.");
    } finally {
      setPendingQtyItemId((current) => (current === itemId ? null : current));
    }
  }

  async function onRemove(itemId: string, variantId: string) {
    if (pendingRemoveItemId === itemId || pendingQtyItemId === itemId) return;
    setPendingRemoveItemId(itemId);
    try {
      if (authorized) {
        const updated = await removeCartItem(itemId);
        setCart(updated);
        return;
      }
      setGuestItems(removeGuestCartItem(variantId));
    } catch {
      setStatus("Не удалось удалить товар из корзины.");
    } finally {
      setPendingRemoveItemId((current) => (current === itemId ? null : current));
    }
  }

  return (
    <section className="grid gap-8">
      <div className="border-b pb-6">
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Корзина
        </h1>
      </div>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      {isLoading ? (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4 border-b pb-6">
              <div className="h-32 w-24 animate-pulse bg-muted" />
              <div className="flex flex-1 flex-col gap-3 pt-1">
                <div className="h-4 w-1/2 animate-pulse bg-muted" />
                <div className="h-3 w-1/4 animate-pulse bg-muted" />
                <div className="h-3 w-1/5 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-6 text-muted-foreground">Корзина пуста</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 border border-foreground px-8 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-white"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
          {/* Items list */}
          <div className="grid gap-0">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[96px_1fr] gap-4 border-b py-6 sm:grid-cols-[112px_1fr]">
                <Link href={getProductHref(item.product)}>
                  <img
                    src={getPrimaryProductImage(item.product)}
                    alt={item.product.name}
                    className="h-32 w-full object-cover sm:h-36"
                  />
                </Link>
                <div className="flex flex-col justify-between gap-2">
                  <div>
                    <Link
                      href={getProductHref(item.product)}
                      className="text-xs uppercase tracking-wide hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground  ">
                      Размер: {formatSizeLabel(item.sizeLabel)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-0 border">
                      <button
                        type="button"
                        aria-label="Уменьшить количество"
                        className="flex h-8 w-8 items-center justify-center text-sm transition-colors hover:bg-muted"
                        onClick={() => void onChangeQty(item.id, item.quantity - 1, item.variantId)}
                        disabled={pendingQtyItemId === item.id || pendingRemoveItemId === item.id}
                      >
                        −
                      </button>
                      <span className="flex h-8 w-8 items-center justify-center border-x text-sm">
                        {pendingQtyItemId === item.id ? (
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        type="button"
                        aria-label="Увеличить количество"
                        className="flex h-8 w-8 items-center justify-center text-sm transition-colors hover:bg-muted"
                        onClick={() => void onChangeQty(item.id, item.quantity + 1, item.variantId)}
                        disabled={pendingQtyItemId === item.id || pendingRemoveItemId === item.id}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-light">{formatPrice(Number(item.product.price) * item.quantity)}</p>
                  </div>
                  <button
                    type="button"
                    className="w-fit text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => void onRemove(item.id, item.variantId)}
                    disabled={pendingQtyItemId === item.id || pendingRemoveItemId === item.id}
                  >
                    {pendingRemoveItemId === item.id ? "Удаление..." : "Удалить"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="min-w-0 border p-6">
            <h2 className="mb-4 text-xs uppercase tracking-[0.2em]">Итого</h2>
            <div className="grid gap-2 border-b pb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 text-sm"
                >
                  <span className="truncate text-muted-foreground">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="whitespace-nowrap text-right tabular-nums">
                    {formatPrice(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
              <span className="text-sm font-medium uppercase tracking-wide">Сумма</span>
              <span className="whitespace-nowrap text-right text-lg font-light tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
            <div className="mt-6 grid gap-2">
              {authorized ? (
                <Button asChild className="h-12 w-full text-xs uppercase tracking-[0.15em] bg-[#d6ab9a] hover:bg-[#e8cec4]">
                  <Link href="/checkout?fromCart=1">Оформить заказ</Link>
                </Button>
              ) : (
                <Button
                  className="h-12 w-full text-xs uppercase tracking-[0.15em] bg-[#d6ab9a] hover:bg-[#e8cec4]"
                  onClick={() => requestAuthRequired(showToast, "checkout")}
                >
                  Оформить заказ
                </Button>
              )}
              <Link
                href="/catalog"
                className="block text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Продолжить покупки
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
