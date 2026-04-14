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
      <body style={{ fontFamily: "sans-serif", margin: 0 }}>
        <header style={{ padding: "12px 20px", borderBottom: "1px solid #ddd" }}>
          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/">Главная</Link>
            <Link href="/catalog">Каталог</Link>
            <Link href="/constructor">Конструктор</Link>
            <Link href="/outfits">Готовые образы</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/admin">Админка</Link>
          </nav>
        </header>
        <main style={{ padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
