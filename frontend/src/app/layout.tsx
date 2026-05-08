import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Fashion Store",
  description: "E-commerce with outfit builder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0, backgroundColor: "#fafafa" }}>
        <header style={{ padding: "12px 20px", borderBottom: "1px solid #ddd" }}>
          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/">Главная</Link>
            <Link href="/catalog">Каталог</Link>
            <Link href="/outfit-builder">Конструктор</Link>
            <Link href="/outfits">Готовые образы</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/cart">Корзина</Link>
            <Link href="/checkout">Оформление</Link>
            <Link href="/profile">Профиль</Link>
            <Link href="/admin">Админка</Link>
          </nav>
        </header>
        <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
