"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Banner,
  Product,
  addProductToCart,
  fetchBanners,
  fetchProducts,
  login,
  mergeGuestCartToServer,
  logout,
  register,
} from "@/lib/api";

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("user@fashionstore.local");
  const [password, setPassword] = useState("User123!");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    void fetchBanners("home").then(setBanners).catch(() => setBanners([]));
    void fetchProducts({ isNew: true }).then(setNewProducts).catch(() => setNewProducts([]));
  }, []);

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await login(email.trim(), password);
      await mergeGuestCartToServer();
      setMessage("Авторизация выполнена. Гостевая корзина объединена с аккаунтом.");
    } catch {
      setMessage("Ошибка авторизации. Проверьте backend и данные входа.");
    }
  }

  async function handleRegister() {
    setMessage("");
    try {
      await register(email.trim(), password);
      await mergeGuestCartToServer();
      setMessage("Пользователь зарегистрирован. Гостевая корзина перенесена.");
    } catch {
      setMessage("Регистрация не удалась.");
    }
  }

  async function handleAddToCart(product: Product) {
    try {
      const mode = await addProductToCart(product, 1);
      setMessage(
        mode === "guest"
          ? "Товар добавлен в гостевую корзину."
          : "Товар добавлен в корзину аккаунта.",
      );
    } catch {
      setMessage("Не удалось добавить товар в корзину.");
    }
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    setMessage("Сессия завершена.");
  }

  return (
    <section style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Fashion Store</h1>
      <p style={{ marginTop: 0 }}>
        Магазин одежды с конструктором образов, сохранением в "Мои образы", корзиной и админкой.
      </p>

      <form
        onSubmit={(event) => void onAuthSubmit(event)}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
      >
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
        />
        <button type="submit">Войти</button>
        <button type="button" onClick={() => void handleRegister()}>
          Регистрация
        </button>
        <button
          type="button"
          onClick={() => void handleLogout()}
        >
          Выйти
        </button>
      </form>

      {message ? <p style={{ color: "#2a5" }}>{message}</p> : null}

      <section>
        <h2>Баннеры главной</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {banners.map((banner) => (
            <article key={banner.id} style={{ border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
              <img src={banner.imageUrl} alt={banner.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              <div style={{ padding: 12 }}>
                <strong>{banner.title}</strong>
                <p>{banner.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Новинки</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {newProducts.map((product) => (
            <article key={product.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 10 }}>
              <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              <h3 style={{ marginBottom: 6 }}>{product.name}</h3>
              <p>{Number(product.price).toLocaleString("ru-RU")} руб</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/catalog/${product.id}`}>Карточка</Link>
                <button onClick={() => void handleAddToCart(product)}>В корзину</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
