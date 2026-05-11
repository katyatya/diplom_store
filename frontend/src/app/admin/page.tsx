"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Order,
  Product,
  adminCreateProduct,
  adminDeleteProduct,
  adminFetchOrders,
  adminFetchProducts,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Одежда");

  async function load() {
    try {
      const [loadedProducts, loadedOrders] = await Promise.all([
        adminFetchProducts(),
        adminFetchOrders(),
      ]);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
    } catch {
      setStatus("Доступ запрещен. Войдите под admin@fashionstore.local / Admin123!");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await adminCreateProduct({
        name: name.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim(),
        category: category.trim(),
      });
      setName("");
      setPrice("0");
      setImageUrl("");
      setStatus("Товар добавлен.");
      await load();
    } catch {
      setStatus("Не удалось создать товар.");
    }
  }

  async function onDeleteProduct(productId: string) {
    try {
      await adminDeleteProduct(productId);
      setStatus("Товар деактивирован.");
      await load();
    } catch {
      setStatus("Не удалось удалить товар.");
    }
  }

  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Админка</h1>
      <p className="text-sm text-muted-foreground">
        Управление товарами, заказами, баннерами и образами стилистов через backend
        `/admin/*`.
      </p>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Добавить товар</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateProduct} className="grid max-w-md gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название"
              required
            />
            <Input
            value={price}
            type="number"
            min={0}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цена"
            required
            />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL картинки"
              required
            />
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Категория"
              required
            />
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {products.map((product) => (
            <article key={product.id} className="rounded-lg border p-3">
              <strong>{product.name}</strong> - {Number(product.price).toLocaleString("ru-RU")} руб
              <p className="my-1 text-sm text-muted-foreground">
                {product.category} / {product.isActive ? "Активен" : "Скрыт"}
              </p>
              <Button size="sm" variant="outline" onClick={() => void onDeleteProduct(product.id)}>
                Удалить
              </Button>
            </article>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заказы (уведомления продавцу)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Новые заказы отображаются здесь сразу после оформления.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-lg border p-3">
              <strong>Заказ {order.id.slice(0, 8)}</strong> - {order.customerName}
              <p className="my-1 text-sm text-muted-foreground">
                {order.email} / {order.phone}
              </p>
              <p className="my-1 text-sm text-muted-foreground">
                {order.deliveryType} / {Number(order.totalAmount).toLocaleString("ru-RU")} руб
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
