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
    <section style={{ display: "grid", gap: 16 }}>
      <h1>Админка</h1>
      <p>Управление товарами, заказами, баннерами и образами стилистов через backend `/admin/*`.</p>
      {status ? <p>{status}</p> : null}

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h2>Добавить товар</h2>
        <form onSubmit={onCreateProduct} style={{ display: "grid", gap: 8, maxWidth: 460 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" required />
          <input
            value={price}
            type="number"
            min={0}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цена"
            required
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL картинки"
            required
          />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" required />
          <button type="submit">Добавить</button>
        </form>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h2>Товары</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {products.map((product) => (
            <article key={product.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <strong>{product.name}</strong> - {Number(product.price).toLocaleString("ru-RU")} руб
              <p style={{ margin: "6px 0" }}>
                {product.category} / {product.isActive ? "Активен" : "Скрыт"}
              </p>
              <button onClick={() => void onDeleteProduct(product.id)}>Удалить</button>
            </article>
          ))}
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <h2>Заказы (уведомления продавцу)</h2>
        <p>Новые заказы отображаются здесь сразу после оформления.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {orders.map((order) => (
            <article key={order.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <strong>Заказ {order.id.slice(0, 8)}</strong> - {order.customerName}
              <p style={{ margin: "4px 0" }}>
                {order.email} / {order.phone}
              </p>
              <p style={{ margin: "4px 0" }}>
                {order.deliveryType} / {Number(order.totalAmount).toLocaleString("ru-RU")} руб
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
