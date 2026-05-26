"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthUser, Order, fetchMe, fetchMyOrders, logout } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ORDER_STATUS_LABELS, getStatusBadgeClass } from "@/lib/orders";
import { formatPrice, formatSizeLabel } from "@/lib/format";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { showToast } = useToast();

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

  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setOrders([]);
      setStatus("Вы вышли из аккаунта.");
      setIsLogoutDialogOpen(false);
      showToast("Вы вышли из аккаунта.");
    } catch {
      showToast("Не удалось выйти из аккаунта.", "error");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Личный профиль</h1>
      {isUserLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Загрузка данных профиля...
        </div>
      ) : user ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {user.name || "Пользователь"} ({user.email})
          </p>
          <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Выйти из аккаунта
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Подтвердите выход</DialogTitle>
                <DialogDescription>
                  Вы действительно хотите выйти из аккаунта?
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={() => void handleLogout()}>Выйти</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
      {!isUserLoading && !user ? (
        <Link href="/" className="w-fit text-sm text-muted-foreground underline-offset-2 hover:underline">
          Войти в аккаунт
        </Link>
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
            {formatPrice(order.deliveryPrice, "word")}
            </p>
            <p className="text-sm text-muted-foreground">Оплата: {order.paymentMethod}</p>
            <p>
              Сумма: <strong>{formatPrice(order.totalAmount, "word")}</strong>
            </p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} ({formatSizeLabel(item.sizeLabel)}) x {item.quantity}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
